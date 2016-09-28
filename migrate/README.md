# Migration Script
This migration script is indented to migrate resources created through the Zendesk Transifex app. Old resources used `KEYVALUEJSON` format and the whole body of articles were stored under a single key: `body`. The new resources will use the HTML format and the body content will be parsed into multiple strings, so in order for the migration to be successfull the markup of the source and translation content in the old resources sould be identical.

## Running the script
in order to run the script from the base folder of this repo run:
```bash
cd migrate
pip install -r requirements.txt
python migrate_resources.py -u <tx_username> -p <tx_password> --source-project-slug=<some_slug> --target-project-slug=<some_other_slug>
```

The options that `migrate_resources.py` accepts are:
* `-u` or `--username`: Transifex Username
* `-p` or `--password`: Transifex password
* `--source-project-slug`: The project that has the old zendesk resources
* `--target-project-slug`: The project that the new resources will be created in (if not supplied the `source-project-slug` will be used)
* `--update-existing`: Re-upload translations for resources that have already been created in the target project e.g. from previous execution of the script. Default value is False.
