Feature: Load a site to live
    As a Developer in Test
    I want to test if a user can use the live sidebar in preview

Scenario: Add site to resource
    Given I open the url "https://txtest.zendesk.com/agent/apps/local-app?zat=true"
    And   I select the iframe named "0"
    Then  I wait on element "#login-form" for 10000ms to be visible
    When  I set "username" to the inputfield "#user_email"
    And   I set "password" to the inputfield "#user_password"
    And   I click on the element "#login-form .button"
    Then  I wait on element ".u-box-100" for 10000ms to be visible
