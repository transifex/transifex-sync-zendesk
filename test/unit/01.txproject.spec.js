import txProject from '../../src/lib/transifex-api/project.js';
import txUtil from '../../src/lib/txUtil.js';
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
    expect(jsonHandlers.getResourceArray).to.not.be.undefined;
  });
  it('should return an array ', () => {
    expect(jsonHandlers.getResourceArray(testJson)).to.be.a('array')
  });
  it('should have a count of 3 ', () => {
    expect(jsonHandlers.getResourceArray(testJson).length).to.be.equal(3)
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
    expect(jsonHandlers.getSourceLocale).to.not.be.undefined;
  });
  it('should return a string ', () => {
    expect(jsonHandlers.getSourceLocale(testJson)).to.be.a('string')
  });
});

describe('A function getLocales', () => {
  let testJson
  before(function() {
    testJson = mockProjectJsonResponse();
  })
  it('should exist ', () => {
    expect(jsonHandlers.getLocales).to.not.be.undefined;
  });
  it('should return a array ', () => {
    expect(jsonHandlers.getLocales(testJson)).to.be.a('array')
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
