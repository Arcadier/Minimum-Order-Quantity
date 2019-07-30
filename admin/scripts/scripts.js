
/**
 * @fileoverview this is the admin side code for the minimum order quantity plugin
 * 
 * @author Abhinav Narayana Balasubramaniam
 */

/**
 * status variable which tells whether the plugin has been enabled/disabled by the admin
 * @type {boolean}
 */
var checkedStatusField;

/**
 * returns the value of the cookie
 * @param {String} name name of the cookie whose value is needed
 * @returns {String} value of the cookie
 */
function getCookie(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
}

/**
 * function to create a custom field 
 * @param {String} customFieldName name of the custom field where data is going to be stored inside
 * @param {String} storedData string data which is going to be stored in the value attribute of a custom field
 * @param {JSON|boolean} customField the json of the existing custom field, pass false if it doesn't exist
 */
function createCustomField(customFieldName, storedData, customField) {
    // all required variables needed to make the API call to store the data
    var baseUrl = document.location.hostname;
    var adminID = document.getElementById("userGuid").value;
    var admintoken = getCookie('webapitoken');

    // if the custom field already exists
    if (customField) {
        // body of the JSON being used
        data = {
            "CustomFields": [
                {
                    "Code": customField.Code,
                    "Values": [
                        storedData
                    ]
                }
            ]
        }
        // settings for the api call
        var settings1 = {
            "url": "https://" + baseUrl + "/api/v2/marketplaces",
            "method": "POST",
            // "async": false,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + admintoken
            },
            "data": JSON.stringify(data)
        };
        // making the api call
        $.ajax(settings1);

    }
    // if the custom field doesn't exist
    else {
        // body of the json making the call
        data = {
            "Name": customFieldName,
            "IsMandatory": true,
            "DataInputType": "textfield",
            "ReferenceTable": "Implementations",
            "DataFieldType": "string"
        }
        // settings being used to make the api call
        var settings2 = {
            "url": "https://" + baseUrl + "/api/v2/admins/" + adminID + "/custom-field-definitions",
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + admintoken
            },
            // "async": false,
            "data": JSON.stringify(data)
        };

        // making the api call to create the definition
        $.ajax(settings2).done(function (response) {
            customField = response;
            data2 = {
                "CustomFields": [
                    {
                        "Code": customField.Code,
                        "Values": [
                            storedData
                        ]
                    }
                ]
            }
            // api call to edit the newly made custom field
            var settings3 = {
                "url": "https://" + baseUrl + "/api/v2/marketplaces",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + admintoken
                },
                // "async": false,
                "data": JSON.stringify(data2)
            };

            $.ajax(settings3);
        });


    }
}

/**
 * Returns the required custom field JSON, false if not found
 * @param {string} customFieldName name of the required custom field
 * @returns {JSON|boolean} the JSON object of the required custom field will be returned, false if the custom field is not found in the implementations table
 */
function returnCustomField(customFieldName) {
    // gets the users webapitoken
    var userToken = getCookie('webapitoken');

    // settings used to make the API call to get all marketplace data
    var settings = {
        "url": "https://" + baseUrl + "/api/v2/marketplaces",
        "method": "GET",
        "async": false,
        "headers": {
            "authorization": "Bearer " + userToken
        }

    }
    // JSON object of all the marketplace custom fields
    var marketPlaceCustomFields;
    // making the ajax call, assigning the custom fields 
    $.ajax(settings).done(function (response) {
        marketPlaceCustomFields = response.CustomFields;
    })
    // finding the required custom field inside the list of all custom field
    for (i = 0; i < marketPlaceCustomFields.length; i++) {
        if (marketPlaceCustomFields[i]["Name"] == customFieldName) {
            return marketPlaceCustomFields[i];
        }
    }
    // return false if the required custom field isn't found inside the list of marketplace custom fields
    return false;
}

/**
 * code which runs after the entire DOM has been rendered in
 */
$(document).ready(function () {
    // see if the moq has been enabled
    checkedStatusField = returnCustomField("checkedstatus");
    // set the moq to checked depending on whether it has been enabled or not
    if (checkedStatusField) {
        var checkedStatus = !!Number(checkedStatusField.Values[0]);
        if (checkedStatus) {
            document.getElementById("toggle-button").checked = true;
        } else {
            document.getElementById("toggle-button").checked = false;
        }
    }
    else {
        document.getElementById("toggle-button").checked = false;
        createCustomField("checkedstatus", "0", checkedStatusField);
    }

})
/**
 * function to manipulate the DOM and set the checker to checked or unchecked
 */
function setStatus() {
    createCustomField("checkedstatus", Number(document.getElementById("toggle-button").checked), checkedStatusField);
}
