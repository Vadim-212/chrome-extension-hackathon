function showNumberValidationError() {
    chrome.tabs.query({active: true}, function(tabs) {
        let tab = tabs[0]
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: () => { 
                let truthAdElement = document.querySelector(`div[data-cy=seller_card]`).children[0].cloneNode()
                truthAdElement.textContent = 'Мы не смогли проверить информацию о продавце. Будьте внимательны'
                truthAdElement.style.color = 'orange'
                document.querySelector(`div[data-cy=seller_card]`).prepend(truthAdElement.cloneNode(true))
                document.querySelector(`div[data-testid=chat-wrapper]`).children[0].prepend(truthAdElement.cloneNode(true))
            }
        })
    })
}

function getResultByNumber(results) {
    let res = results[0].result
    if(res) {
        if(res != 'wrongNumber') {
            fetch(`http://localhost:8080/is_it_safe/${res}`).then(r => r.json()).then(result => {
                if(!result.verdict) {
                    chrome.tabs.query({active: true}, function(tabs) {
                        let tab = tabs[0]
                        chrome.scripting.executeScript({
                            target: {tabId: tab.id},
                            func: () => { 
                                let fraudWarningElement = document.querySelector(`div[data-cy=seller_card]`).children[0].cloneNode()
                                fraudWarningElement.textContent = 'Продавец был замешан в случаях мошенничества'
                                fraudWarningElement.style.color = 'red'
                                document.querySelector(`div[data-cy=seller_card]`).prepend(fraudWarningElement.cloneNode(true))
                                document.querySelector(`div[data-testid=chat-wrapper]`).children[0].prepend(fraudWarningElement.cloneNode(true))
                            }
                        })
                    })
                } else {
                    chrome.tabs.query({active: true}, function(tabs) {
                        let tab = tabs[0]
                        chrome.scripting.executeScript({
                            target: {tabId: tab.id},
                            func: () => { 
                                let truthAdElement = document.querySelector(`div[data-cy=seller_card]`).children[0].cloneNode()
                                truthAdElement.textContent = 'Продавец честен или данные о нём не найдены'
                                truthAdElement.style.color = 'green'
                                document.querySelector(`div[data-cy=seller_card]`).prepend(truthAdElement.cloneNode(true))
                                document.querySelector(`div[data-testid=chat-wrapper]`).children[0].prepend(truthAdElement.cloneNode(true))
                            }
                        })
                    })
                }
            }).catch(reason => {
                showNumberValidationError()
            })
        } else {
            showNumberValidationError()
        }
    } else {
        showNumberValidationError()
    }
}

chrome.webRequest.onCompleted.addListener(function(details) {
    if(details.url.includes('phone-view')) {
        chrome.tabs.query({active: true}, function(tabs) {
            let tab = tabs[0]
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                func: () => { 
                    let number = document.querySelector(`a[data-testid=contact-phone]`).textContent
                    number = number.replaceAll(' ', '')
                    if (number.substring(0,2) == '+8') {
                        number = '+7' + number.substring(2)
                    } else if(number[0] == '8') {
                        number = '+7' + number.substring(1)
                    } else if (number.substring(0,2) == '77') {
                        number = '+7' + number.substring(1)
                    } else if (number[0] == '7' && number[1] != '7') {
                        number = '+7' + number
                    }
                    if(number.length != 12) {
                        return 'wrongNumber'
                    } else {
                        return number
                    }
                }
            }, getResultByNumber)
        })
        
    }
}, { urls: ["https://www.olx.kz/*"] })

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if(changeInfo && changeInfo.status == "complete" ) {
        if(tab.url) {
            let tabUrl = new URL(tab.url)
            
            if(tabUrl.hostname == 'www.olx.kz') {
                chrome.scripting.executeScript({
                    target: {tabId: tabId},
                    func: () => { 
                        setTimeout(() => {
                            document.querySelector(`button[data-testid=show-phone]`).click()
                        }, 200)
                    }
                })
            }
        }
    }
})
