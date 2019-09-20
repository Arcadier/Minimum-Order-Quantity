/**
 * @fileoverview user side code for the minimum order quantity plugin
 * 
 * @author Abhinav Narayana Balasubramaniam
 * @author Naseer Ahmed khan
 */
/**
 * A regex that satisfies the class name of the item details page.
 * @constant
 * @type {regex}
 */
var itemRegex = /item-detail-page[\s\S]*/;

/**
 * A regex that satisfies the class name of the cart details page.
 * @constant
 * @type {regex}
 */
var cartRegex = /page-cart[\s\S]*/;

/**
 * The base URL of the page to call APIs.
 * @constant
 * @type {String} 
 */
var baseURL = window.location.hostname;

/**
 * The Authorization token of the user.
 * @type {String}
 */
var authToken;

/**
 * The itemGuid of the current Item.
 * @constant
 * @type {String}
 */
var itemID;

/**
 * The Minimum Order Quantity value the current Item.
 * @type {Int}
 */
var moqVal;

/**
 * The webapi token for the user 
 * @constant
 * @type {String}
 */
var userToken = getCookie('webapitoken');


$(document).ready(function () {
//If MOQ is enabled
    if (MOQ()) {
        console.log("MOQ Plugin Running");
            // authToken = getAuthToken();
            //If it is the item detail page.
            console.log("body class name", document.body.className)
            if (document.body.className.match(itemRegex)) {

                itemID = document.getElementById("itemGuid").value;
                moqVal = moqValue(itemID);
                // The selector node that is used to set quantity.
                var quantity = document.getElementById("itemDetailQty");
                
                var optionNodes = $('.option-value');
                if(optionNodes.length!=0){
                    optionNodes[0].onchange = removeOptionsBuyPage;
                }
                removeOptionsBuyPage();

                //Disbale or enable add to cart button depending on quantity.
                quantity.onchange = changedQuantity;
                var currQuantity = parseInt(quantity.value);
                //Disbale button if default quantity is less than MOQ.
                if (moqVal > currQuantity) {
                    disableButton(moqVal);
                }
            }
            //IF it is the cart detail page
            else if (document.body.className.match(cartRegex)) {
                setQuantities();
            }
        }
});

function removeOptionsBuyPage(){
    var quantity = document.getElementById("itemDetailQty");
    quantity.value = moqVal;
    var quantityChildren = quantity.children;
    var length = quantityChildren.length;
    for(let i=0;i<moqVal-1;i++){
        if(i<length){
            var currNode = quantityChildren[i];
            $(currNode).addClass("hide");
        }
    }
}

/**
 * MOQ - This function checks if the admin has enabled MOQ by checking
 * the value of the custom field "checkstatus"
 *
 * @return {boolean}  true if enabled,false if disabled
 */
function MOQ() {

    //Call API to get Custom Fields.
    var moq = false;
    var url = "https://" + baseURL + "/api/v2/marketplaces";
    var call = {
        "url": url,
        "method": "GET",
        "async": false
    };
    $.ajax(call).done(function (res) {
        var cfs = res["CustomFields"];
        //Iterate through Custom Fields to find checkedstatus
        for (var i = 0; i < cfs.length; i++) {
            var cf = cfs[i];
            if (cf["Name"] == "checkedstatus") {
                // Convert the integer 1 or 0 to boolean
                moq = !!parseInt(cf["Values"][0]);
                // console.log(moq);
            }
        }
    });
    return moq;
}



/**
 * moqValue - This function gives the Minimum Order Quantity of an item.
 *
 * @param  {String} itemID The itemGuid of the item.
 * @return {Boolean|Int} The Minimum order quantity of the item.
 */
function moqValue(itemID) {
    var moqVal = 1;
    //Call API to get the Item Custom Fields.
    var url = "https://" + baseURL + "/api/v2/items/" + itemID;
    var call = {
        "url": url,
        "method": "GET",
        "async": false
    };
    $.ajax(call).done(function (res) {
        var cfs = res["CustomFields"];
        if (cfs) {
            //Iterate through the Custom Fields to find MinimumOrderQuantity
            for (var i = 0; i < cfs.length; i++) {
                var cf = cfs[i];
                if (cf["Name"] == "MinimumOrderQuantity") {
                    moqVal = parseInt(cf["Values"][0]);
                }
            }
        }

    });

    return moqVal;
}


/**
 * getAuthToken - This function returns the authorization token of the user.
 *
 * @return {String} Authorization Token
 */
function getAuthToken() {
    var cookies = "; " + document.cookie;
    cookies = cookies.split("; webapitoken=");
    if (cookies.length == 1) {
        var token = cookies[1].split(";")[0];
    }
    else {
        var token = cookies[1].split(";")[0];
    }

    return token;
}


/**
 * disableButton - This function disables all add to cart buttons. When you press add to cart you will get an error saying
 * Minimum order quantity is not satisfied, the minimum order should be [moqVal].
 *
 * @param  {Int} moqVal - The minimum order value to be displayed in the error
 */
function disableButton(moqVal) {
    var addToCart = document.getElementsByClassName("add-cart-btn");
    //Iterate through all add to cart buttons and change the href of the a tag.
    for (var i = 0; i < addToCart.length; i++) {
        var button = addToCart[i];
        button.href = "javascript:toastr.error('Minimum quantity should be " + moqVal + "','MOQ Error')";
    }
}


/**
 * enableButton - This function enables all add to cart buttons. They will not show error anymore, they will add to cart
 *
 */
function enableButton() {
    var addToCart = document.getElementsByClassName("add-cart-btn");
    //Iterate through all add to cart buttons and change the href to add to cart
    for (var i = 0; i < addToCart.length; i++) {
        var button = addToCart[i];
        button.href = "javascript:itemDetail.addItemToCart()";
    }
}



/**
 * changedQuantity - This function enables or disables the add to cart button depending on the quantity
 * selected by the user and the global variable that stores the Minimum order quantity of current item.
 *
 */
function changedQuantity() {
    //Get value of selector.
    var currQuantity = parseInt(document.getElementById("itemDetailQty").value);
    if (moqVal > currQuantity) {
        disableButton(moqVal);
    }
    else {
        enableButton();
    }

}


/**
 * removeOptions - This function removes all the options lower than the moq value in a selector.
 *
 * @param  {Node} selector The selector node being targetted
 * @param  {Int} moqVal    Minimum Order Quantity value
 */
function removeOptions(selector, moqVal) {
    var options = selector.childNodes;
    for (var i = 0; i < options.length; i++) {
        var option = options[i];
        if (option.nodeName == "OPTION") {
            if (moqVal > option.value) {
                option.remove();
            }
            else {
                break;
            }
        }

    }
}



/**
 * setQuantities - This function uses removeOptions to remove all the options of all selectors lower than
 * the currently selected option.
 * The correct way to implement this function would be to remove all the options lower than the MOQ. But in order
 * to get the MOQ of each item, we need itemGuid which is not present in the cart detail page.
 * @TODO: Once the itemGuid is availabe in the cart detail way implement the correct implementation.
 *
 */
function setQuantities() {
    var quantitySelectors = $(".qty-selectbpx");
    for (var i = 0; i < quantitySelectors.length; i++) {
        var qSelector = quantitySelectors[i];
        var value = parseInt(qSelector.value);
        removeOptions(qSelector, value);
    }



}
/**
 * Status variable to check if the MOQ has been removed from the custom fields div and moved into the required position
 * @type {boolean} 
 */
var fieldRemoved = false;
/**
 * name of the custom field which has been made by the package
 * @constant
 * @type {String}
 */
var customField = "MinimumOrderQuantity";
/**
 * the minimum order quantity input tag which has to be found and moved
 * @type {Node}
 */
var requiredTag;
/**
 * status variable which checks if MOQ is applied for a particular item
 * @type {boolean}
 */
var moqChecked = false;
/**
 * status variable which checks if MOQ is applied by the admin
 * @type {boolean}
 */
var shouldWork;
/**
 * status variable which tells whether the input tag must be moved from the custom fields div into the respective div
 * @type {boolean}
 */
var change;

/**
 * code which is run after the dom has been rendered in
 */
$(document).ready(
    function () {
        if (document.body.className == "page-seller seller-items seller-upload-page pace-running") {
            shouldWork = returnCustomField("checkedstatus");
            if (shouldWork) {
                if (Number(shouldWork.Values[0])) {
                    change = true;
                    setTimeout(changeTagPosition(), 1000);
                } else {
                    change = false;
                    setTimeout(changeTagPosition(), 1000);
                }
            } else {
                change = false;
                setTimeout(changeTagPosition(), 1000);
            }
        }
        if (document.body.className == "page-seller seller-items seller-item-page pace-running") {
            shouldWork = returnCustomField("checkedstatus");
            // console.log("should work", shouldWork);
            setTimeout(function () {
                if (shouldWork) {
                    if (Number(shouldWork.Values[0])) {
                        change = true;
                        checkForField();
                    } else {
                        change = false;
                        checkForField();
                    }
                } else {
                    change = false;
                    checkForField();
                }
            }, 300);
        }
    }
)
/**
 * append the element to the required position inside the item upload/edit page
 * @param {Node} element 
 */
function appendRequiredField(element) {
    // get the required parent node
    var requiredContainer = document.getElementsByClassName("container")[4].getElementsByClassName("item-form-group")[0];
    // append it at the required position
    requiredContainer.insertBefore(element, requiredContainer.children[1])
}

/**
 * callback being used on the event that a change occurs in the children list inside the custom fields div
 * @param {Object} mutationList 
 */
function callback(mutationList) {
    // accounting for each type of mutation
    mutationList.forEach((mutation) => {
        switch (mutation.type) {
            // only the case where elements of the child list has been changed
            case 'childList':
                // if the field hasn't been removed from the custom-fields div
                if (!fieldRemoved) {
                    // required node
                    var targetNode = document.getElementById("customFields");
                    // list of all custom fields appended by default
                    var fields = targetNode.children;
                    // check for the required custom field
                    for (let i = 0; i < fields.length; i++) {
                        if (fields[i].children[1].getAttribute("data-name") == customField) {
                            requiredTag = fields[i];
                            break;
                        }
                    }
                    requiredTag.children[0].innerText="MINIMUM ORDER QUANTITY";
                    var parentNode = requiredTag.parentElement;
                    // remove the required tag from the custom-field table
                    parentNode.removeChild(requiredTag);
                    // setting the status of field removed to true
                    fieldRemoved = true;
                    // if the plugin is enabled then change the location of the custom field to a different position in the item upload page
                    if (change) {
                        // make the row for minimum quantity
                        var minQuan = $.parseHTML('<div></div>')[0];
                        // appending the required custom field tag to the row
                        minQuan.appendChild(requiredTag);
                        // make the checker which lets the merchant to enable/disable MOQ for the particular item
                        var checker = $.parseHTML(`<div class="col-md-6">
                                                    <label>&nbsp;</label>
                                                    <div class="onoffswitch" >
                                                        <input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox cb-stock" id="test" onclick="clickedme()" >
                                                        <label class="onoffswitch-label" for="test">
                                                            <span class="onoffswitch-inner"></span>
                                                            <span class="onoffswitch-switch"></span>
                                                        </label>
                                                    </div>
                                                    <span class="item-stock-lbl">Enable</span>
                                                </div>`)[0];
                        // appending the checker node to the row node
                        minQuan.appendChild(checker);
                        // making and appending a clearfix element to the end of the row element
                        var clearfix = $.parseHTML(`<div class="clearfix"></div>`)[0];
                        minQuan.appendChild(clearfix);
                        // setting all the required attributes
                        requiredTag.children[1].setAttribute('type', 'number');
                        requiredTag.children[1].value = 1;
                        requiredTag.children[1].setAttribute('disabled', 'true');
                        // append the row element to the required position
                        appendRequiredField(minQuan);
                    }
                }
                break;
        }
    });
}

/**
 * to change the position of the custom fields tag after the custom field gets added into the respective div
 */
function changeTagPosition() {
    // getting the ndoe where the custom fields will be added into
    var targetNode = document.getElementById("customFields");
    // settings for the mutationobserver
    var observerOptions = {
        childList: true
    }
    // initializing the mutation observer object
    var observer = new MutationObserver(callback);
    // setting the observe property of the observer to notice changes in target Node with the specified options
    observer.observe(targetNode, observerOptions);
}
/**
 * function to change whether the moq has been enabled/disabled for a particular item
 */
function clickedme() {
    // change the checked status of moqChecked
    moqChecked = !moqChecked;

    if (moqChecked) {
        // if moq is checked remove disabled attribute
        requiredTag.children[1].removeAttribute('disabled')

    } else {
        // if moq is not checked set its value to 1 and remove the disabled attribute
        requiredTag.children[1].value = 1;
        requiredTag.children[1].setAttribute('disabled', 'true')
    }

}

/**
 * return the value of a custom field inside the implementations table
 * @param {String} customFieldName name of the custom field which is going to be found
 * @returns {JSON|boolean} returns the json of the custom field found otherwise it returns false
 */
function returnCustomField(customFieldName) {
    // settings to make the api call to retrieve all the marketplace information
    var settings1 = {
        "url": "https://" + baseURL + "/api/v2/marketplaces",
        "method": "GET",
        "async": false,
        "headers": {
            "authorization": "Bearer " + userToken
        }

    }
    // all the marketplace customfields
    var mpCustomFields = []
    $.ajax(settings1).done(function (response) {
        mpCustomFields = response.CustomFields;
    })
    // find and return the value of the custom field if found else return false
    var cf = false;
    for (i = 0; i < mpCustomFields.length; i++) {

        if (mpCustomFields[i]["Name"] == customFieldName) {
            cf = mpCustomFields[i];
            break;
        }
    }
    return cf;
}

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
 * function which runs on the opening of the item edit page
 */
function changeItemPage() {
    // node from which custom fields is to be extracted from
    var targetNode = document.getElementById("customFields");
    // all the custom fields inside the custom fields div
    var fields = targetNode.children;
    // finding the required custom field input tag
    for (let i = 0; i < fields.length; i++) {
        if (fields[i].children[1].getAttribute("data-name") == customField) {
            requiredTag = fields[i];
            break;
        }
    }
    // the parent node of the MOQ input tag
    var parentNode = requiredTag.parentElement;
    requiredTag.children[0].innerText="MINIMUM ORDER QUANTITY";
    // removing the MOQ input tag from the custom fields div
    parentNode.removeChild(requiredTag);
    // checking if the MOQ plugin has been turned on from the admin page
    if (change) {
        // making the row node for the MOQ input tag to be added into
        var minQuan = $.parseHTML('<div></div>')[0];
        // appending the moq input tag into the row made
        minQuan.appendChild(requiredTag);
        // making the slider node which needs to be appended
        var checker = $.parseHTML(`<div class="col-md-6">
                                        <label>&nbsp;</label>
                                        <div class="onoffswitch" >
                                            <input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox cb-stock" id="test" onclick="clickedme()" >
                                            <label class="onoffswitch-label" for="test">
                                                <span class="onoffswitch-inner"></span>
                                                <span class="onoffswitch-switch"></span>
                                            </label>
                                        </div>
                                        <span class="item-stock-lbl">Enable</span>
                                    </div>`)[0];
        // appending the checker to the row created
        minQuan.appendChild(checker);
        // making and appending a clearfix element to the row
        var clearfix = $.parseHTML(`<div class="clearfix"></div>`)[0];
        minQuan.appendChild(clearfix);
        requiredTag.children[1].setAttribute('type', 'number');
        // setting the checked status of the MOQ for a particular item
        if (requiredTag.children[1].value == 1) {
            requiredTag.children[1].setAttribute('disabled', 'true')
            checker.children[1].children[0].checked = false;
        } else {
            checker.children[1].children[0].checked = true;
            moqChecked = true;
        }
        // appending the minimum quantity row to the required position
        appendRequiredField(minQuan);
    }
}

function checkForField(){
    var moved = false;
    function customMutationObserver(){
        setTimeout(function(){
            try{
                if($('#customFields')[0].children.length){
                    moved = true;
                    changeItemPage();
                }
            }   
            catch{

            }
            if(!moved){
                customMutationObserver();
            }
        },1000);
    }
    customMutationObserver();
}
