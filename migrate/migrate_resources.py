#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import re
import sys
import requests
from functools import wraps
from requests.auth import HTTPBasicAuth
from requests.exceptions import RequestException
from optparse import OptionParser

SLUG_REGEX = re.compile('(articles|sections|categories)-[0-9]{8}')

# This block ensures that ^C interrupts are handled quietly.
try:
    import signal

    def exithandler(signum, frame):
        signal.signal(signal.SIGINT, signal.SIG_IGN)
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        sys.exit(1)

    signal.signal(signal.SIGINT, exithandler)
    signal.signal(signal.SIGTERM, exithandler)
    if hasattr(signal, 'SIGPIPE'):
        signal.signal(signal.SIGPIPE, signal.SIG_DFL)

except KeyboardInterrupt:
    sys.exit(1)


def handle_exception(func):
    @wraps(func)
    def _wrapper(request, *args, **kwargs):
        try:
            r = func(request, *args, **kwargs)
            r.raise_for_status()
        except RequestException:
            print "Error: {}".format(r.content)
            raise
        else:
            return json.loads(r.content)
    return _wrapper

@handle_exception
def _get_project(options):
    url = 'http://www.transifex.com/api/2/project/{}/'.format(
        options.project_slug
    )
    return requests.get(
        url, auth=HTTPBasicAuth(options.username, options.password)
    )


@handle_exception
def _get_project_resources(options, project_slug):
    url = 'http://www.transifex.com/api/2/project/{}/resources/'.format(
        project_slug
    )
    return requests.get(
        url, auth=HTTPBasicAuth(options.username, options.password)
    )


@handle_exception
def _get_project_languages(options):
    url = 'http://www.transifex.com/api/2/project/{}/languages/'.format(
        options.project_slug
    )
    return requests.get(
        url, auth=HTTPBasicAuth(options.username, options.password)
    )


@handle_exception
def _get_source_content(options, resource_slug):
    url = 'http://www.transifex.com/api/2/project/{}/resource/{}/content/'.format(
        options.project_slug, resource_slug
    )
    return requests.get(
        url, auth=HTTPBasicAuth(options.username, options.password)
    )


@handle_exception
def _get_translations(options, resource_slug, language_code):
    url = 'http://www.transifex.com/api/2/project/{}/resource/{}/translation/{}'.format(
        options.project_slug, resource_slug, language_code
    )
    return requests.get(
        url, auth=HTTPBasicAuth(options.username, options.password)
    )


@handle_exception
def _create_new_resource(options, old_resource, new_slug):
    zd_type = SLUG_REGEX.match(old_resource['slug']).group(1)
    json_content = _get_source_content(options, old_resource['slug'])
    url = 'http://www.transifex.com/api/2/project/{}/resources/'.format(
        options.target_slug
    )
    data = {'name': new_slug,
            'slug': new_slug,
            'priority': 0,
            'i18n_type': 'HTML',
            'content': _construct_html_content(json_content['content'], zd_type)}
    return requests.post(
        url, data=json.dumps(data), auth=HTTPBasicAuth(options.username, options.password),
        headers={"Content-Type": "application/json"}
    )


def _upload_new_translations(options, old_slug, new_slug, language_code):
    print "Uploading {} translations for {} resource.".format(language_code, new_slug)
    zd_type = SLUG_REGEX.match(old_slug).group(1)
    json_content = _get_translations(options, old_slug, language_code)
    url = 'http://www.transifex.com/api/2/project/{}/resource/{}/translation/{}/'
    url = url.format(options.target_slug, new_slug, language_code)
    data = {'content': _construct_html_content(json_content['content'], zd_type)}
    return requests.put(
        url, data=json.dumps(data), auth=HTTPBasicAuth(options.username, options.password),
        headers={"Content-Type": "application/json"}
    )


@handle_exception
def _get_resource_stats(options, slug):
    url = 'http://www.transifex.com/api/2/project/{}/resource/{}/stats/'
    url = url.format(options.project_slug, slug)
    return requests.get(
        url, auth=HTTPBasicAuth(options.username, options.password)
    )


def _filter_zendesk_resources(resources):
    return [r for r in resources if SLUG_REGEX.match(r['slug']) and
            r['i18n_type'] == 'KEYVALUEJSON']


def _construct_html_content(json_content, zd_type):
    content_dict = {
        'title': '',
        'body': '',
        'name': '',
        'description': ''
    }
    if zd_type == 'articles':
        template = u'<head></body><h1>{title}</h1>{body}</body></head>'
    elif zd_type == 'categories':
        template = u'<head></body><h1>{name}</h1>{description}</body></head>'
    else:
        template = u'<head></body><h1>{name}</h1></body></head>'

    content_dict.update(json.loads(json_content))
    return template.format(**content_dict)


def _copy_resources(options, resources, target_resources):
    skipping, failed = [], {}
    target_resource_slugs = [r['slug'] for r in target_resources]
    old_zd_resources = _filter_zendesk_resources(resources)

    for res in old_zd_resources:
        new_slug = 'HTML-{}'.format(res['slug'])
        if new_slug in target_resource_slugs:
            print "Skipping creation of {} resource. Already exists.".format(res['slug'])
            skipping.append(res['slug'])
            if not options.update_existing:
                continue
        else:
            new_res = _create_new_resource(options, res, new_slug=new_slug)
        stats = _get_resource_stats(options, res['slug'])
        for code, stat in stats.iteritems():
            if code != res['source_language_code'] and stat['translated_entities'] > 0:
                try:
                    r = _upload_new_translations(options, res['slug'], new_slug, code)
                    r.raise_for_status()
                except RequestException:
                    print "Error: {}".format(r.content)
                    if new_slug not in failed.keys():
                        failed[new_slug] = []
                    failed[new_slug].append(code)
    if failed:
        print "Failed to migrate translations for:\n"
        '\n'.join(["{}: {}".format(key, ', '.join(value)) for key, value in failed.iteritems()])


def migrate_project(options):
    resources = _get_project_resources(options, options.project_slug)
    target_resources = _get_project_resources(options, options.target_slug)
    _copy_resources(options, resources, target_resources)


def main(argv=None):
    """
    Here we parse the flags (short, long) and we instantiate the classes.
    """
    if argv is None:
        argv = sys.argv[1:]
    usage = "usage: %prog [options] "
    description = "This is the Transifex Sync migration script which allows you"\
                  " to migrate resources from the old to new style of segmentation"\
                  " for resources created through Zendesk.\nIf you'd like to"\
                  " check the available commands issue `%prog help` or if you"\
                  " just want help with a specific command issue `%prog help"\
                  " command`"

    parser = OptionParser(
        usage=usage, description=description
    )
    parser.disable_interspersed_args()
    parser.add_option(
        "-u", "--username", action="store", dest="username",
        default=False, help=("Transifex username")
    )
    parser.add_option(
        "-p", "--password", action="store", dest="password", type="string",
        default=False, help="Transifex password"
    )
    parser.add_option(
        "--source-project-slug", action="store", dest="project_slug", type="string",
        default=None, help="Transifex project slug associated with zendesk"
    )
    parser.add_option(
        "--target-project-slug", action="store", dest="target_slug", type="string",
        default=None, help="Transifex project the new resources should be created in"
    )
    parser.add_option(
        "--update-existing", action="store_true", dest="update_existing",
        default=False, help="Update already created resources"
    )
    (options, args) = parser.parse_args()
    if not (options.username and options.password and options.project_slug):
        print "Missing arguments. Please supply both your credentials and source project slug."
        sys.exit()

    if not options.target_slug:
        print "Empty target project slug, {} will be used.".format(options.project_slug)
        options.target_slug = options.project_slug

    try:
        migrate_project(options)
    except SystemExit:
        sys.exit()
    except:
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
