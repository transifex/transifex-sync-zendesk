Feature: Transifex-Zendesk integration
    As a Developer in Test
    I want to test if the transifex-zendesk-sync plugin works as expected.

Scenario: Login to zendesk
    Given I open the url "https://txtest2.zendesk.com/agent/apps/local-app?zat=true"
    And   I select the iframe named "0"
    Then  I wait on element "#login-form" for 10000ms to be visible
    When  I set "username" to the inputfield "#user_email"
    And   I set "password" to the inputfield "#user_password"
    And   I click on the element "#login-form .button"
    Then  I wait on element ".u-box-100" for 10000ms to be visible

Scenario: Upload single and multiple articles to Transifex
    Then  I wait on element ".o-tabs__item" for 10000ms to be visible
    And   I expect that element ".o-tabs__item:eq(0)" has the class "is-active"
    Then  I wait on element ".js-batch-upload" for 3000ms to be visible
    And   I expect that element ".js-batch-upload" has the class "is-disabled"
    And   I wait a little more
    When  I click ".o-interactive-list__item:eq(0) .js-checkbox"
    And   I wait a little more
    Then  I expect that element ".js-batch-upload" does not have the class "is-disabled"
    And   I expect that element ".js-batch-upload" contains the text "Send Articles (1)"
    And   I wait a little more
    When  I click ".o-interactive-list__item:eq(1) .js-checkbox"
    Then  I expect that element ".js-batch-upload" does not have the class "is-disabled"
    And   I expect that element ".js-batch-upload" contains the text "Send Articles (2)"
    And   I wait a little more
    When  I click ".js-batch-upload"
    And   I wait on element ".js-notification-message:eq(0)" for 10000ms to be visible
    Then  I expect that element ".js-notification-message:eq(0)" contains the text "2 articles were successfully uploaded to Transifex."
    And   I wait a little more
    When  I click ".o-interactive-list__item:eq(2) .js-checkbox"
    And   I wait a little more
    When  I click ".js-batch-upload"
    And   I wait on element ".js-notification-message:eq(0)" for 10000ms to be visible
    Then  I expect that element ".js-notification-message:eq(0)" contains the text "1 articles were successfully uploaded to Transifex."
