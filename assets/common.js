var gDebug = true;
const PLOT_ID_KEY = "icj-plot-id-temp";
const PLOT_DATE_KEY = "icj-plot-date-temp";

var gSite = {
    get main() {
        return document.getElementById("main");
    },

    get mainInner() {
        return document.getElementById("main-inner");
    },

    get loader() {
        return document.getElementById("load-overlay");
    },

    onDOMLoad: function () {
        gActions.initTargets();
        gActions.initFirstView(window.location.search);
    },

    onLoad: function () {
        gActions.initLinks();
    },

    onPopState: function (aEvent) {
        gActions.initFirstView(aEvent.target.location.search, false);
    },

    toggleAttribute: function (elementId, attributeName) {
        let container = document.getElementById(elementId);
        let isAttributeTrue = container.getAttribute(attributeName) == "true";
        let state = isAttributeTrue ? "false" : "true";
        container.setAttribute(attributeName, state);
        container.removeAttribute("prehidden");
    },

    getView: async function (aViewName) {
        let viewUrl = "views/" + aViewName + ".html";
        var viewHtml;
        await fetch(viewUrl, {
            method: "GET",
            cache: gDebug ? "no-cache" : "default",
        }).then(async function (aResponse) {
            viewHtml = await aResponse.text();
        }).catch(function (aError) {
            viewHtml = "";
        });
        return viewHtml;
    },

    setLoad: function (aIsLoading) {
        let loader = this.loader;
        let mainInner = this.mainInner;
        if (aIsLoading) {
            loader.dataset.active = true;
            mainInner.dataset.isLoading = true;
            return;
        }
        delete mainInner.dataset.isLoading;
        delete loader.dataset.active;
    },
};

var gActions = {
    initTarget: function (aTarget) {
        if (!aTarget) {
            return false;
        }
        if (typeof aTarget === "string") {
            aTarget = document.getElementById(aTarget);
        }
        if (aTarget.getAttribute("_")) {
            return false;
        }
        
        let targetIDs = aTarget.getAttribute("targetId").split(",");
        let attributeName = aTarget.getAttribute("targetAttr");
        for (let j = 0; j < targetIDs.length; j++) {
            if (targetIDs[j] && attributeName) {
                aTarget.addEventListener(
                    "click",
                    function (e) {
                        gSite.toggleAttribute(targetIDs[j], attributeName);
                    }
                );
                aTarget.setAttribute("_", "true");
            }
        }
        
        return true;
    },
    
    initTargets: function () {
        let actionElements = document.getElementsByClassName("has-action");
        for (let i = 0; i < actionElements.length; i++) {
            gActions.initTarget(actionElements[i]);
        }
    },

    initLinks: function () {
        let dynamicLinks = document.getElementsByClassName("dyn");
        for (let i = 0; i < dynamicLinks.length; i++) {
            let currentLink = dynamicLinks[i];
            if (currentLink.dataset.marked) {
                continue;
            }
            currentLink.addEventListener("click", async function (aEvent) {
                aEvent.preventDefault();
                let viewName = currentLink.dataset.viewName;
                let actionName = "actionName" in currentLink.dataset ?
                                 currentLink.dataset.actionName :
                                 viewName;
                gActions.switchToView(viewName, actionName);
                // FIXME: This is a hack.
                let plotId = "id" in currentLink.dataset ?
                             currentLink.dataset.id :
                             0;
                localStorage.setItem(PLOT_ID_KEY, plotId);
                let plotDate = "date" in currentLink.dataset ?
                               currentLink.dataset.date :
                               0;
                localStorage.setItem(PLOT_DATE_KEY, plotDate);
            });
            currentLink.dataset.marked = true;
        }
        
        // FIXME: This is also a hack.
        let plotSpan = document.getElementById("plot-id");
        if (plotSpan) {
            plotSpan.innerText = localStorage.getItem(PLOT_ID_KEY);
        }
        let dateSpan = document.getElementById("date-box");
        if (dateSpan) {
            dateSpan.innerText = localStorage.getItem(PLOT_DATE_KEY);
        }
    },

    initFirstView: function (aQuery, aUpdateState = true) {
        let parameters = new URLSearchParams(aQuery);
        let viewName = parameters.get("view");
        if (!viewName) {
            viewName = "home";
        }
        let actionName = parameters.get("action");
        if (!actionName) {
            actionName = viewName;
        }
        gActions.switchToView(viewName, actionName, aUpdateState);
    },

    switchToView: async function (aViewName, aActionName, aUpdateState = true) {
        if (aUpdateState) {
            let url = new URL(window.location);
            url.searchParams.set("view", aViewName);
            if (aActionName != aViewName) {
              url.searchParams.set("action", aActionName);
            } else {
              url.searchParams.delete("action");
            }
            window.history.pushState({}, "", url);
        }

        if (gActions.activeAction) {
            let actionParent = gActions.activeAction.parentNode;
            delete actionParent.dataset.active;
        }

        let activeAction = document.getElementById(`action-${aActionName}`);
        if (activeAction) {
            activeAction.parentNode.dataset.active = true;
            gActions.activeAction = activeAction;
        }

        gSite.setLoad(true);
        gSite.mainInner.innerHTML = await gSite.getView(aViewName);
        gSite.main.scrollTop = 0;
        gActions.initLinks();
        gSite.setLoad(false);
    },
};

window.addEventListener("DOMContentLoaded", gSite.onDOMLoad);
window.addEventListener("load", gSite.onLoad);
window.addEventListener("popstate", gSite.onPopState);
