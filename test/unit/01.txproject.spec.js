import txProject from '../../src/javascripts/transifex-api/project.js';
import txUtil from '../../src/javascripts/txUtil.js';
import io from '../../src/javascripts/io.js';
import {
  install
}
from 'source-map-support'
install()

global.jsonHandlers = txProject.jsonHandlers
global.txProject = txProject

describe('A function getResourceArray', () => {
  let testJson
  before(function() {
    testJson = mockProjectJsonResponse();
  })
  it('should exist ', () => {
    expect(io.getResourceArray).to.not.be.undefined;
  });
  it('should return an object ', () => {
    io.setResourceArray(testJson);
    expect(io.getResourceArray()).to.be.a('object')
  });
  it('should have a count of 3 ', () => {
    io.setResourceArray(testJson);
    expect(io.getResourceArray().resources.length).to.be.equal(3)
  });
  /* A
  it('each item should contain "slug" ', () => {

    // Check that we are pulling the slug keys
    var test = function (name) { return name.includes('slug') }
    jsonHandlers.getResourceArray(testJson).forEach(function(name,i){
      console.log('\nCheck array item:' + i)
      expect(test(name)).to.be.true
    });
  });
*/
});

describe('A function getSourceLocale', () => {
  let testJson
  before(function() {
    testJson = mockProjectJsonResponse();
  })
  it('should exist ', () => {
    expect(txProject.helpers.getSourceLocale).to.not.be.undefined;
  });
  it('should return a string ', () => {
    expect(txProject.helpers.getSourceLocale(testJson)).to.equal('en')
  });
});

describe('A function getLocales', () => {
  let testJson
  before(function() {
    testJson = mockZDLocalesJsonResponse();
  })
  it('should exist ', () => {
    expect(io.getLocales).to.not.be.undefined;
  });
  it('should return an array', () => {
    io.setLocales(testJson);
    expect(io.getLocales()).to.be.a('Array')
  });
});

describe('A function convertUrlToApi', () => {
  let projectUrl
  before(function() {
    projectUrl = 'https://www.transifex.com/test-organization-4/zendesk-test/'
  })
  it('should exist ', () => {
    expect(txUtil.convertUrlToApi).to.not.be.undefined;
  });
  it('should return a string ', () => {
    expect(txUtil.convertUrlToApi(projectUrl)).to.be.a('string')
  });
  it('should return a string that includes api ', () => {
    expect(txUtil.convertUrlToApi(projectUrl)).to.be.string('/api/2/')
  });
  it('should return false if string unconverted ', () => {
    expect(txUtil.convertUrlToApi('')).to.be.a('boolean')
    expect(txUtil.convertUrlToApi('')).to.be.false
  });
});

describe('A function extractOrgFromUrl', () => {
  let projectUrl
  before(function() {
    projectUrl = 'https://www.transifex.com/test-organization-4/zendesk-test/'
  })
  it('should exist ', () => {
    expect(txUtil.extractOrgFromUrl).to.not.be.undefined;
  });
  it('should return an object ', () => {
    expect(txUtil.extractOrgFromUrl(projectUrl)).to.be.a('object')
  });
  it('should return a string that includes api ', () => {
    expect(txUtil.extractOrgFromUrl(projectUrl).organization_slug).to.be.string('test-organization-4');
    expect(txUtil.extractOrgFromUrl(projectUrl).project_slug).to.be.string('zendesk-test');
  });
  it('should return empty object if string unconverted ', () => {
    expect(txUtil.extractOrgFromUrl('')).to.be.a('object')
    expect(txUtil.extractOrgFromUrl('').organization_slug).to.be.string('');
    expect(txUtil.extractOrgFromUrl('').project_slug).to.be.string('');
  });
});

describe('A function isValidAPIUrl', () => {
  let projectApiUrl
  before(function() {
    projectApiUrl = 'http://www.transifex.com/api/2/project/zendesk-test/'
  })
  it('should exist ', () => {
    expect(txUtil.isValidAPIUrl).to.not.be.undefined;
  });
  it('should return a boolean ', () => {
    expect(txUtil.isValidAPIUrl(projectApiUrl)).to.be.a('boolean')
  });
});

function mockProjectJsonResponse() {
  return {
    archived: false,
    last_updated: '2015-05-28T00:25:25.568',
    description: 'txtest',
    tags: '',
    trans_instructions: '',
    private: true,
    slug: 'txtest-1',
    source_language_code: 'en',
    auto_join: false,
    maintainers: [{
      username: 'TestMattJJacko',
    },],
    fill_up_resources: false,
    team: {
      id: 41053,
      name: 'txtest team',
    },
    organization: {
      slug: 'test-organization-4',
    },
    teams: [
      'fr_BE',
    ],
    homepage: '',
    long_description: '',
    resources: [{
      slug: 'articles-205686967-slug',
      name: 'articles-205686967-name',
    }, {
      slug: 'articles-205686968-slug',
      name: 'articles-205686968-name',
    }, {
      slug: 'articles-205686969-slug',
      name: 'articles-205686969-name',
    },],
    name: 'txtest',
  };
}

function mockZDLocalesJsonResponse() {
  return [{
    'url':'https://txtest.zendesk.com/api/v2/locales/en-US.json',
    'id':1,
    'locale':'en-US',
    'name':'English',
    'native_name':'English',
    'presentation_name':'English',
    'rtl':false,
    'created_at':null,
    'updated_at':'2017-01-27T23:03:43Z',
    'default':true
  }, {
    'url':'https://txtest.zendesk.com/api/v2/locales/es.json',
    'id':2,
    'locale':'es',
    'name':'Español',
    'native_name':'español',
    'presentation_name':'Spanish - español',
    'rtl':false,
    'created_at':'2009-02-07T15:08:57Z',
    'updated_at':'2017-01-27T23:37:02Z',
    'default':false
  }];
}
