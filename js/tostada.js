(function() {

    'use strict';

    var options = {
        prependTo: document.body.childNodes[0],
        lifeSpan: 4000,
        position: 'top-right',
        animate: false,
        animateDuration: 0
    };

    var classes = {
        container: 'toast-container',
        animate: 'toast-exit',
        default: 'toast',
        success: 'toast-success',
        info: 'toast-info',
        warning: 'toast-warn',
        error: 'toast-error'
    };

    var clickListener = null;
    var onHideCallback = null;

    var closeToastada = function (forced) {
        var toastContainer = document.querySelector('.' + classes.container);

        if (!toastContainer) {
            return;
        }

        var closeMe = toastContainer.querySelector('.close-me');
        if (closeMe) { closeMe.removeEventListener('click', closeToastada); }

        toastContainer.querySelectorAll('.toast').forEach(function (toast){
            toast.remove();
        });

        toastContainer.removeEventListener('click', clickListener);
        if (!forced && onHideCallback) { onHideCallback(); }
        toastContainer.remove();
    };

    var toastada = {

        setOptions: setOptions,

        setClasses: setClasses,

        success: function(msg) {
            placeToast(msg, 'success');
        },

        info: function(msg) {
            placeToast(msg, 'info');
        },

        warning: function(msg) {
            placeToast(msg, 'warning');
        },

        error: function(msg) {
            placeToast(msg, 'error');
        },

        closeAll: function () { closeToastada('forced'); }

    };

    function setOptions(opts) {
        // eslint-disable-next-line no-restricted-syntax
        for (var key in opts) {
            if (opts.hasOwnProperty(key)) {
                if (key in options) {
                    options[key] = opts[key];
                }
            }
        }

        if (opts.onClick) {
            clickListener = opts.onClick;
        } else {
            clickListener = null;
        }

        if (opts.onDismiss) {
            onHideCallback = opts.onDismiss;
        } else {
            onHideCallback = null;
        }

    }

    function setClasses(classDict) {

        // eslint-disable-next-line no-restricted-syntax
        for (var key in classDict) {
            if (classDict.hasOwnProperty(key)) {
                if (key in classes) {
                    classes[key] = classDict[key];
                }
            }
        }

    }

    function shimForIe(node) {
        Object.defineProperty(node, 'remove', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function remove() {
                if (this.parentNode !== null)
                    this.parentNode.removeChild(this);
            }
        });
    }

    function placeToast(html, toastType) {

        var toastContainer = document.querySelector('.' + classes.container);

        var containerExists = !!toastContainer;

        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = classes.container;
            shimForIe(toastContainer);
        }

        var newToast = document.createElement('div');
        newToast.className = classes.default + ' ' + classes[toastType];
        shimForIe(newToast);

        newToast.innerHTML = html;

        if (!containerExists) {

            // Set toast container position
            switch(options.position) {

                case 'top-right':
                    toastContainer.style.top = '2vw';
                    toastContainer.style.right = '2vw';
                    break;

                case 'center-center':
                    toastContainer.style.top = '50vh';
                    toastContainer.style.right = '50vw';
                    toastContainer.style.margin = '-17vw -17vw 0 0';
                    break;

                // case 'top-left':
                //     toastContainer.style.top = '10px';
                //     toastContainer.style.left = '10px';
                //     break;
                //
                // case 'bottom-left':
                //     toastContainer.style.bottom = '10px';
                //     toastContainer.style.left = '10px';
                //     break;
                //
                // case 'bottom-right':
                //     toastContainer.style.bottom = '10px';
                //     toastContainer.style.right = '10px';
                //     break;

                default:
                    toastContainer.style.top = '2vw';
                    toastContainer.style.right = '2vw';
            }

            document.body.insertBefore(toastContainer, options.prependTo);

        }

        toastContainer.insertBefore(newToast, toastContainer.childNodes[0]);
        if (clickListener) {
            toastContainer.addEventListener('click', clickListener);
        }
        toastContainer.querySelector('.close-me').addEventListener('click', closeToastada);

        // This timeout is used for the duration that the
        // toast will stay on the page
        setTimeout(function() {

            var container, numToasts, closeMe;
            // Animation is set to perform
            if (options.animate && options.animateDuration) {

                newToast.classList.add(classes.animate);

                // This timeout is used to defer the reomval of the
                // toast from the dom for `options.animateDuration`
                // milliseconds
                setTimeout(function() {

                    closeMe = toastContainer.querySelector('.close-me');
                    if (closeMe) { closeMe.removeEventListener('click', closeToastada); }
                    newToast.remove();

                    container = document.querySelector('.' + classes.container);
                    numToasts = container ? container.childNodes.length : 1;

                    if (!numToasts) {
                        toastContainer.removeEventListener('click', clickListener);
                        if (onHideCallback) { onHideCallback(); }
                        toastContainer.remove();
                    }

                }, options.animateDuration);

            } else {

                closeMe = toastContainer.querySelector('.close-me');
                if (closeMe) { closeMe.removeEventListener('click', closeToastada); }
                newToast.remove();

                container = document.querySelector('.' + classes.container);
                numToasts = container ? container.childNodes.length : 1;

                if (!numToasts) {
                    toastContainer.removeEventListener('click', clickListener);
                    if (onHideCallback) { onHideCallback(); }
                    toastContainer.remove();
                }

            }

        }, options.lifeSpan);

    }

    window.toastada = toastada;

})();
