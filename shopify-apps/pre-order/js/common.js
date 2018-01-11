var isPoAppInstalled = true;
(function(){
    // SPOParams - liquid vars, SPOConfig - specific product options
    var app = {
        config: {
            folder: 'pre-order',
            prefix: 'SPO'
        }
    };
    app.config.backendUrl = '//shopify-apps.spur-i-t.com/' + app.config.folder + '/subscriptions';
    app.config.s3Prefix = '//s3.amazonaws.com/shopify-apps/' + app.config.folder;
    app.config.s3SharedPrefix = '//s3.amazonaws.com/all-apps';

    var loadScript = function(url, callback, errcallback){
        var script = document.createElement("script");
        script.type = "text/javascript";
        if (script.readyState){// If the browser is Internet Explorer.
            script.onreadystatechange = function(){
                if (script.readyState == "loaded" || script.readyState == "complete"){
                    script.onreadystatechange = null;
                    callback();
                }
            };
            setTimeout(function(){
                if(script.onreadystatechange !== null){
                    if(errcallback !== undefined) errcallback();
                }
            },5000);
        } else { // For any other browser.
            script.onload = function(){
                callback();
            };
            script.onerror = function(){
                if(errcallback !== undefined) errcallback();
            }
        }
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    };

    app.init = function($){
        window.spuritJQ = $;
        $('head').append('<link rel="stylesheet" href="'+ app.config.s3Prefix + '/css/common.css" type="text/css" />');
        $('head').append('<link rel="stylesheet" href="'+ app.config.s3Prefix + '/css/tooltipster.css" type="text/css" />');
        $('head').append('<link rel="stylesheet" href="'+ app.config.s3Prefix + '/store/' + SPOParams.id + '.css?' + Math.random() + '" type="text/css" />');

        $('body').append('<img src="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/0.16.1/images/loader-large.gif" id="poLoader" style="display:none; position: fixed; top:50%; left:50%; z-index: 100;">');

        loadScript(app.config.s3Prefix + '/store/' + SPOParams.id + '.js?' + Math.random(), function(){
            loadScript(app.config.s3Prefix + '/js/jquery.spur.cart.api.js', function(){// Including api.jquery.js
                loadScript(app.config.s3Prefix + '/js/jquery.tooltipster.min.js', function(){// Including tooltipster plugin
                    loadScript(app.config.s3SharedPrefix + '/js/spuritgeo.min.js', function(){
                        app.resolve(function(){
                            app.run($);
                        });
                    });
                });
            });
        }, function(){
            app.revert($);
        });
    };
    app.getGeoSettings = function(settings){
        if(settings.geolocation_enabled == '1' && typeof settings.geolocation === 'object' && Object.keys(settings.geolocation).length){
            return settings.geolocation;
        }else{
            return null;
        }
    };
    app.resolve = function(callback){
        if(app.getGeoSettings(SPOConfig)){
            SpuritGeo.resolve(function () {
                callback();
            });
        }else{
            callback();
        }
    };
    app.geoAllowedSync = function () {
        if(this.geoAllowed === undefined){
            var geosettings = this.getGeoSettings(SPOConfig);
            if(geosettings){
                this.geoAllowed =  SpuritGeo.allowedSync(geosettings);
            }else{
                this.geoAllowed = true;
            }
        }
        return this.geoAllowed;
    };
    app.revert = function($){//restore add to cart button
        if(SPOParams.hideAddToCartButton === true && SPOParams.addToCartButtonSelector !== undefined){
            $(SPOParams.addToCartButtonSelector).first().show();
        }
    };
    app.getPageType = function(){
        var url = window.location.toString();
        if(url.match(/\/products\//) !== null || url.match(/\/products_preview/) !== null){
            return 'product';
        }else if(url.match(/\/cart/) !== null){
            return 'cart';
        }else if(url.match(/\/collections\//) !== null){
            return 'collection';
        }else{
            return '';
        }
    };
    app.alert = function(msg){
        this.loader();
        alert(msg);
    };
    app.loader = function(){
        if(!app.loaderImage){
            app.loaderImage = document.getElementById('poLoader');
        }
        if(app.loaderImage.style.display == 'block'){
            app.loaderImage.style.display = 'none';
        }else{
            app.loaderImage.style.display = 'block';
        }
    };
    app.confirm = function(msg, callbackYes, callbackNo){
        var answer = confirm(msg);
        if(answer){
            callbackYes();
        }else{
            if(callbackNo !== undefined){
                callbackNo();
            }
        }
    };
    app.reload = function(){ window.location.reload(); };
    app.isIosAgent = function(){
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return ( userAgent.match( /iPad/i ) || userAgent.match( /iPhone/i ) || userAgent.match( /iPod/i ) )
    };
    app.isMobileDevice = function(){
        return ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) );
    };
    app.goToCart = function(){
        var url = (typeof(SPOCustom) !== 'undefined' && typeof(SPOCustom.urlPrefix) !== 'undefined') ? SPOCustom.urlPrefix+'/cart': '/cart';
        window.location.href = url;
    };
    app.goToCheckout = function(discount){
        if (typeof SAWCheckout == "function") {
            SAWCheckout();
        } else {
            var params = discount.length ? '?discount='+discount : '';
            window.location.href = '/checkout'+params;
        }
    };
    app.run = function($){
        var Config = (function(storeConfig){
            var config = storeConfig;
            var keysMap = {"po_button_note":"button_description","po_button_text":"button_title"};
            var prefixable = ['quantity_selector','variant_selector','addtocart_selector','preorder_selector','product_form_selector'];
            var self = {
                init: function(){
                    config['quantity_selector'] = this.hasCustom('quantityInput') ? this.getCustom('quantityInput') : 'input[name=quantity]';
                    config['product_form_selector'] = 'form[action^="/cart/add"]';
                    config['variant_selector'] = this.hasCustom('variantInput') ? this.getCustom('variantInput') : '[name=id]';
                    config['preorder_selector'] = '#pre-order';
                    config['selector_prefix'] = this.hasCustom('selectorPrefix') ? this.getCustom('selectorPrefix') : '';
                    config['cart_form_selector'] = this.hasCustom('cartFormSelector') ? this.getCustom('cartFormSelector') : "form[action*='cart'], form[action*='checkout']"
                },
                get: function(key, subset){
                    if(key && subset){
                        return config[subset][key];
                    }else{
                        if(keysMap.hasOwnProperty(key)){
                            return config[keysMap[key]];
                        }else{
                            return config[key];
                        }
                    }
                },
                setValue: function(key, value){
                    var conf = config;
                    var keys = [];
                    if(key.indexOf('.') !== -1){
                        keys = key.split('.');
                    }
                    var length = keys.length;
                    if(length){
                        for(var i = 0; i < length-1; i++) {
                            var elem = keys[i];
                            if( !conf[elem] ) conf[elem] = {};
                            conf = conf[elem];
                        }
                        conf[keys[length-1]] = value;
                    }else{
                        config[key] = value;
                    }
                },
                getSelector: function(key, addGlobalPrefix){
                    addGlobalPrefix = addGlobalPrefix || true;
                    if(addGlobalPrefix && config['selector_prefix'] && prefixable.indexOf(key) !== -1){
                        return config['selector_prefix'] + config[key];
                    }else{
                        return config[key];
                    }
                },
                getCartQuantitySelector: function(id){
                    var selector = Config.hasCustom('cartQuantitySelector') ? Config.getCustom('cartQuantitySelector') : "[id^='updates_:id']";
                    selector = (selector.indexOf(':id') !== -1) ? selector.replace(':id',id) : selector;
                    return config['selector_prefix'] ? config['selector_prefix'] + selector : selector;
                },
                getLinePropertyName: function(){ return Config.get('line_property_name') ? Config.get('line_property_name') : 'Pre-ordered items' },
                getProductValue: function(pid, key){
                    if(config.products.hasOwnProperty(pid)){
                        return config.products[pid][key];
                    }else{
                        return undefined;
                    }
                },
                getVariantValue: function(pid,vid,key){
                    var variantsData = Config.getProductValue(pid, 'variants');
                    if(typeof variantsData === 'string' && variantsData.length){
                        variantsData = JSON.parse(variantsData);
                        Config.setValue('products.'+pid+'.variants',variantsData);
                    }
                    if(variantsData && typeof variantsData[vid] !== 'undefined' && typeof variantsData[vid][key] !== 'undefined'){
                        return variantsData[vid][key];
                    }else{
                        return null;
                    }
                },
                getProductOrGlobalValue: function(pid, key){
                    var value = Config.getProductValue(pid, key);
                    return value ? value : Config.get(key);
                },
                getVariantOrGlobalValue: function(pid, vid, key){
                    var val  = Config.getVariantValue(pid, vid, key);
                    if(val){
                        return val;
                    }else{
                        return Config.getProductOrGlobalValue(pid,key);
                    }
                },
                getPreOrderLimit: function(pid,vid){
                    vid = vid || 0;
                    var limit = Config.getVariantValue(pid,vid,'po_limit');
                    if(!limit){
                        if(Config.getProductValue(pid,'po_limit_enabled') == 1){
                            limit = Config.getProductValue(pid,'po_limit')
                        }else if(Config.get('preorder_max_items') != 0){
                            limit = Config.get('preorder_max_items');
                        }
                    }
                    if(limit){
                        return parseInt(limit);
                    }else{
                        return 999999;
                    }
                },
                isPreOrderIgnored: function(pid){
                    var p = Config.getProductValue(pid,'po_enabled');
                    return (p == 2 || ((Config.get('auto_po') == 2) && (p == 0 || p == undefined) ));
                },
                isPreOrderEnabled: function(pid){
                    var productFlag = Config.getProductValue(pid,'po_enabled');
                    var globalFlag = Config.get('auto_po');
                    globalFlag = (globalFlag == 1);
                    if(productFlag !== undefined ){
                        if(productFlag == -1){
                            return false;
                        }else if(productFlag == 1){
                            return true;
                        }else{
                            return globalFlag;
                        }
                    }else{
                        return globalFlag;
                    }
                },
                isPreOrderPossible: function(pid,vid, qty){
                    if(!Config.isPreOrderStarted(pid,vid)) return false;
                    if(!Config.isPreOrderEnabled(pid)) return false;
                    if(qty < 0){
                        qty = Math.abs(qty);
                        if(Config.getPreOrderLimit(pid,vid) < qty) return false;
                    }
                    return true;
                },
                isPreOrderStarted: function(pid,vid){
                    var getTime = function(date){
                        return (date.getTime() + date.getTimezoneOffset() * 60 * 1000);
                    };
                    var now = new Date();
                    var startDate = Config.getVariantOrGlobalValue(pid,vid,'po_started_at');
                    if(startDate){
                        startDate = new Date(startDate);
                        if(now.getTime() < getTime(startDate)) return false;
                    }
                    var endDate = Config.getVariantOrGlobalValue(pid,vid,'po_finished_at');
                    if(endDate){
                        endDate = new Date(endDate);
                        if(now.getTime() > getTime(endDate)) return false;
                    }
                    return true;
                },
                getOptionsSelector: function(pid,addGlobalPrefix){
                    addGlobalPrefix = addGlobalPrefix || true;
                    var selector = "select[id|='product-select-"+pid+"-option'], select[id|='product-select-option'], select[id|='productSelect-option'], select[id|='ProductSelect-option'], input[id|='ProductSelect-option'], select[id|='product-variants-option'], select[id|='sca-qv-product-selected-option'], select[id|='product-variants-"+ pid +"-option'], select[id|='variant-listbox-option'], select[id|='product-selectors-option'], select[id|='variant-listbox-option'], select[id|='product-select-"+pid+"product-option'], select[id|='id-option'], select[id|='SingleOptionSelector'], select[id|='product-select-"+pid+"']";
                    if(addGlobalPrefix && config['selector_prefix']){
                        selector.replace(new RegExp(',', 'g'), ', ' + config['selector_prefix']);
                        selector = config['selector_prefix'] + selector;
                    }
                    if(Config.hasCustom('customVariantSelectors')){
                        var customSelector = Config.getCustom('customVariantSelectors');
                        if(typeof customSelector === 'string' && customSelector.length > 3){
                            selector = customSelector;
                        }
                    }
                    return selector;
                },
                getPreOrderConfirmMessage: function(stock){ return Config.get('preorder_confirm_message').replace(':stock',stock); },
                getLimitExceededMessage: function(variant){
                    var pid = variant.getProductId();
                    var vid = variant.getId();
                    var stock = parseInt(variant.getStock());
                    var limit = Config.getPreOrderLimit(pid,vid);
                    if(Config.isPreOrderStarted(pid,vid) && Config.isPreOrderEnabled(pid) && limit){
                        var diff = stock + parseInt(limit);
                        var msg = Config.get('preorder_stock_limited_message');
                        if(msg !== undefined){
                            return diff > 0 ? msg.replace(':stock',diff) : msg.replace(':stock',0);
                        }
                    }
                    return Config.get('preorder_limited_message');
                },
                isInStockEnabled: function(){ return false; },//todo implementation
                hasCustom: function(key){ return (typeof(SPOCustom) !== 'undefined' && typeof(SPOCustom[key]) !== 'undefined' ) ? true : false; },
                getCustom: function(key){ return (typeof(SPOCustom) !== 'undefined' && typeof(SPOCustom[key]) !== 'undefined' ) ? SPOCustom[key] : undefined; }
            };
            self.init();
            return self;
        })(SPOConfig);

        var Variant = function(id, product){
            var variant;
            for (var i = 0; i < product.variants.length; i++) {
                if (product.variants[i].id == id) {
                    variant = product.variants[i];
                }
            }
            if(variant === undefined){ throw new Error('There is no variant for id: '+id); }
            this.getId = function(){ return variant.id; };
            this.getProductId = function(){ return product.id; };
            this.getStock = function(){
                return variant.inventory_quantity;
            };
            this.trackingEnabled = function(){
                return (variant.inventory_management !== null);
            };
            this.isPreOrderEnabled = function(){
                return (variant.inventory_policy != 'deny')
                    && (variant.inventory_management == 'shopify' || Config.get('support_non_shopify_inventory') == '1')
                    && !isNaN(parseFloat(variant.inventory_quantity));
            };
            this.getPreOrderQty = function(qty){
                var stock = this.getStock();
                if(stock<=0){
                    return qty;
                }else if(stock < qty){
                    return qty - stock;
                }else{
                    return 0;
                }
            };
            this.getNewStockLevel = function(qty){
                var stock = this.getStock();
                return stock - qty;
            };
            this.getTitle = function(){
                return product.title + ' ' + variant.title;
            };
        };

        var VariantsRegistry = (function () {
            return {
                variants: {},
                addWithKey: function(key, variant){ this.variants[key] = variant; },
                add: function (variant) { this.variants[variant.getId()] = variant; },
                getAll: function () { return this.variants; },
                get: function (key) { return this.variants[key]; },
                has: function (key) { if (this.variants.hasOwnProperty(key)) { return true; } else { return false; } }
            }
        })();

        var Tooltip = function(button,params){
            var self = this;
            this.visible = false;
            this.offsetY = undefined;
            this.button = button;
            this.params = params;
            this.setContent = function(content){
                content = content || '';
                this.params.content = content;
                this.button.tooltipster('content',content);
                if(!content.length){
                    this.hide();
                }
            };
            this.isFixed = function(){
                return (typeof this.params.mode !== 'undefined' && this.params.mode != 'tooltip')
            };
            this.getOffsetY = function(){
                if(this.offsetY === undefined && this.adminIframe.length){
                    this.offsetY = this.adminIframe.width() > 50 ?  this.adminIframe.height() : 0;
                }
                return this.offsetY;
            };
            this.setOffsetY = function(offsetY){
                if(this.params.mode == 'bottom'){
                    offsetY = -offsetY;
                }
                this.button.tooltipster('option','offsetY',offsetY);
            };
            this.show = function(){
                this.visible = true;
                if(this.isFixed() && this.params.content.length){
                    this.button.tooltipster('show');                    
                }
            };
            this.hide = function(){
                this.visible = false;
                if(this.isFixed()){
                    this.button.tooltipster('hide');
                }
            };
            this.destroy = function(){
                if(this.isFixed()){
                    this.button.tooltipster('destroy');
                }
                $(window).off('scroll',self.onScroll);
            };
            this.onScroll = function(){
                try{
                    if(self.visible){
                        self.setOffsetY(self.getOffsetY());
                    }
                }catch(e){}
            };
            if(this.isFixed()){
                this.params.trigger = 'custom';
                this.params.autoClose = false;
                this.button.tooltipster(this.params);
                this.button.tooltipster('show');
            }else{
                this.button.tooltipster(this.params);
            }
            this.adminIframe = $( "#admin_bar_iframe" );
            $(window).on('scroll',self.onScroll);
        };

        var PreOrderButton = function(addToCart,params,onClick){
            this.tooltip = undefined;
            this.params = params;
            this.jaddbtn = addToCart;
            this.jbtn = undefined;
            this.initTooltip = function(button,variant){
                var tooltip;
                if(this.hasTooltipForVariant(variant)){
                    var offsetY = (typeof this.params.offsetY !== 'undefined') ?  this.params.offset : 0;
                    var params = {
                        content: this.getDescription(variant),
                        position: Config.get('button_description_position'),
                        maxWidth: 350,
                        mode: Config.get('button_description_mode'),
                        offsetY: offsetY
                    };
                    tooltip = new Tooltip(button,params);
                    tooltip.show();
                }
                return tooltip;
            };
            this.getDescription = function(variant){//todo eliminate same calls
                return Config.getVariantOrGlobalValue(variant.getProductId(),variant.getId(),'po_button_note');
            };
            this.getTitle = function(variant){
                return Config.getVariantOrGlobalValue(variant.getProductId(),variant.getId(),'po_button_text');
            };
            this.hasTooltipForVariant = function(variant){
                if(typeof this.params.tooltip === 'undefined' || this.params.tooltip){
                    var desc = this.getDescription(variant);
                    if(desc && desc.length){
                        return true;
                    }
                }
                return false;
            };
            this.hasTooltip = function(){
                return this.tooltip !== undefined;
            };
            this.init = function(jaddbtn, variant){
                var jbtn = jaddbtn.parent().find('#pre-order').first();
                if(!jbtn.length){
                    jbtn = $('<input type="submit" id="pre-order" value="'+ this.getTitle(variant) +'"/>');
                    jaddbtn.after(jbtn);
                }
                jbtn.show();
                jbtn.on('click',function(ev){
                    onClick(ev);
                });
                return jbtn;
            };
            this.show = function(variant){
                if(this.jbtn === undefined){
                    this.jbtn = this.init(this.jaddbtn,variant);
                    this.tooltip = this.initTooltip(this.jbtn,variant);
                }else{
                    this.jbtn.val(this.getTitle(variant));
                    this.jbtn.show();
                    if(this.hasTooltip()){
                        this.tooltip.setContent(this.getDescription(variant));
                        this.tooltip.show();
                    }else{
                        this.tooltip = this.initTooltip(this.jbtn,variant);
                    }
                }
            };
            this.hide = function(){
                if(this.jbtn !== undefined){
                    if(this.hasTooltip()){
                        this.tooltip.hide();
                    }
                    this.jbtn.hide();
                }
            };
            this.destroy = function(){
                if(this.jbtn !== undefined){
                    if(this.hasTooltip()){
                        this.tooltip.destroy();
                        this.tooltip = undefined;
                    }
                    this.jbtn.remove();
                }
            };
        };

        var Cart = (function(){
            var urlPrefix = '';
            if(Config.hasCustom('urlPrefix')){
                urlPrefix = Config.getCustom('urlPrefix');
                SpurShopify.url_prefix = urlPrefix;
            }
            return {
                getProducts: function(items, callback){
                    var products = {};
                    var uniqueProductsCount = 0;
                    var askedProducts = 0;
                    var count = items.length;
                    if (items == undefined || !count) return false;
                    for(var i in items){
                        var item = items[i];
                        if(!products.hasOwnProperty(item.product_id)){
                            uniqueProductsCount++;
                            products[item.product_id] = {id:item.product_id, variantId: item.id, handle: item.handle };
                        }
                    }
                    for(var j in products){
                        var product = products[j];
                        SpurShopify.getProduct(product.handle, function(data){
                            askedProducts++;
                            products[data.id] = data;
                            if(askedProducts == uniqueProductsCount) callback(products);
                        });
                    }
                },
                post: function(url,data,callback){
                    $.ajax({
                        type: 'POST',
                        url: url,
                        cache: false,
                        dataType: 'json',
                        data: data
                    }).done(function(){
                        if(callback !== undefined) callback();
                    });
                },
                addItem: function(id,qty,properties,callback){
                    Cart.post(urlPrefix+'/cart/add.js',{id: id,quantity: qty,properties: properties}, function(){
                        if(callback !== undefined) callback();
                    });
                },
                addPreOrder: function(id, qty, preorder, callback){
                    var itemObj = {};
                    if(preorder > 0){
                        itemObj[Config.getLinePropertyName()] = preorder;
                    }
                    Cart.addItem(id,qty,itemObj, function(){
                        if(callback !== undefined) callback();
                    });
                },
                removeItem: function(id, callback){
                    SpurShopify.removeItem(id, function(){
                        if(callback !== undefined) callback(id);
                    });
                }
            }
        })();

        var CartPage = function(pageParams){
            if(!pageParams.items.length) return;
            var items = pageParams.items;
            var inProgress = false;
            var form;
            var obj = this;
            this.init = function(){
                items = this.convertPropertiesIntoObject(items);
                if(typeof items[0].product !== 'undefined'){
                    var products = {};
                    items.map(function(item){
                        products[item.product.id] = item.product;
                    });
                    obj.run(products);
                }else{
                    Cart.getProducts(items, function(products){
                        obj.run(products);
                    });
                }
            };
            this.run = function(products){
                if(!products) throw new Error('Empty products api response');
                obj.initVariants(products);
                obj.initButtons();
                form = $(Config.getSelector('cart_form_selector'));
                if(!form) throw new Error('Cart form was not detected');
                form.on('submit', function(ev){
                    if(inProgress) ev.preventDefault();
                });
            };
            this.convertPropertiesIntoObject = function(items){
                items.map(function(item,i){
                    if(typeof item.properties !== 'undefined' && Array.isArray(item.properties) && item.properties.length){
                        var props = {};
                        item.properties.map(function(prop){
                            props[prop[0]] = prop[1];
                        });
                        item.properties = props;
                    }
                });
                return items;
            };
            this.processButtonClick = function(callbackOk, callbackStop){
                app.loader();
                var variants = VariantsRegistry.getAll();
                var confirmations = {};
                var alerts = {};
                var updates = {};
                if(!variants) return;
                var updateCartItems = function(){
                    callbackStop();
                    if(Config.hasCustom('trackLineItemProperties')){
                        obj.updateCartItemsWithProperties(updates, callbackOk);
                    }else{
                        obj.updateCartItems(updates, callbackOk);
                    }
                };
                for(var id in variants){
                    var variant = variants[id];
                    if(Config.isPreOrderIgnored(variant.getProductId()) || !variant.isPreOrderEnabled()){
                        continue;//skip ignored products
                    }
                    var qty = this.getQuantity(variant.getId());
                    var preOrderQty = variant.getPreOrderQty(qty);
                    var currentPreOrderQty = this.getCurrentPreOrderedQty(variant);
                    var newQty = variant.getNewStockLevel(qty);
                    if(preOrderQty > 0){
                        if(app.geoAllowedSync() && Config.isPreOrderPossible(variant.getProductId(),variant.getId(),newQty)){
                            if(currentPreOrderQty != preOrderQty){
                                updates[id] = {variant: variant, preOrder: preOrderQty, quantity: qty};//the items to update the properties
                            }
                            if(!obj.isPreOrderedItem(variant)){
                                confirmations[id] = {stock: variant.getStock(), title: variant.getTitle()};//if we should ask customer
                            }
                        }else{
                            alerts[id] = {msg: variant.getTitle()+': '+Config.getLimitExceededMessage(variant)};//if any limit exceeded
                        }
                    }else if(currentPreOrderQty > preOrderQty){//pre-ordered items qty has been decreased into the cart
                        updates[id] = {variant: variant, preOrder: preOrderQty, quantity: qty};//the items to update the properties
                    }
                }
                if(Object.keys(alerts).length){
                    callbackStop();
                    app.alert(this.getAlertMessage(alerts));
                }else if(Object.keys(confirmations).length){
                    app.confirm(this.getConfirmationMessage(confirmations), function(){
                        updateCartItems();
                    }, function(){
                        app.loader();
                        callbackStop();
                    });
                }else{
                    if(Object.keys(updates).length){
                        updateCartItems();
                    }
                }
            };
            this.isPreOrderedItem = function(variant){
                var currentPreOrderedQty = this.getCurrentPreOrderedQty(variant);
                return (currentPreOrderedQty > 0);
            };
            this.getCurrentPreOrderedQty = function(variant){
                var preOrderedQty = 0;
                for(var i in items){
                    var item = items[i];
                    if(item.variant_id == variant.getId()){
                        if(item.properties && item.properties.hasOwnProperty(Config.getLinePropertyName())){
                            preOrderedQty += parseInt(item.properties[Config.getLinePropertyName()]);
                        }
                    }
                }
                return isNaN(preOrderedQty) ? 0 : preOrderedQty;
            };
            this.getConfirmationMessage = function(confirmations){
                var msg = '';
                for(var i in confirmations){
                    var item = confirmations[i];
                    var template = Config.getPreOrderConfirmMessage(item.stock);
                    msg += ' ' + item.title + ': ' + template + ',';
                }
                msg = msg.slice(0,-1);//remove last comma
                return msg;
            };
            this.getAlertMessage = function(alerts){
                var msg = '';
                for(var i in alerts){
                    var item = alerts[i];
                    msg += ' ' + item.msg + ';';
                }
                msg = msg.slice(0,-1);//remove last comma
                return msg;
            };
            this.updateCartItems = function(updates, callbackOk){//todo remove that
                var updatedItems = 0;
                var preOrder;
                var updatesCount = Object.keys(updates).length;
                inProgress = true;//we should prevent submit as we have to update cart items
                var variantIds = [];
                for(var varId in updates){
                    variantIds.push(varId);
                }
                var index = 0;
                var ItemUpdater = function(){//update cart items one by one with delay to avoid sh api issue
                    var varId = variantIds[index++];
                    Cart.removeItem(varId, function(id){
                        setTimeout(function(){
                            Cart.addPreOrder(id,updates[id]['quantity'], updates[id]['preOrder'],function(){
                                if(++updatedItems == updatesCount){
                                    inProgress = false; callbackOk();
                                }else{
                                    setTimeout(ItemUpdater,50);
                                }
                            });
                        },50);
                    });
                };
                ItemUpdater();
            };
            this.updateCartItemsWithProperties = function(updates, callbackOk){//todo refactoring
                var updatedItems = 0;
                var preOrder;
                var updatesCount = Object.keys(updates).length;
                inProgress = true;//we should prevent submit as we have to update cart items
                var variantIds = [];
                for(var varId in updates){
                    variantIds.push(varId);
                }
                var index = 0;
                var ItemUpdater = function(){//update cart items one by one with delay to avoid shopify cart api issue
                    var varId = variantIds[index++];
                    Cart.removeItem(varId, function(id){
                        var goToNextLineItem = function(){
                            if(++updatedItems == updatesCount){
                                inProgress = false; callbackOk();
                            }else{
                                setTimeout(ItemUpdater,50);
                            }
                        };
                        var newLineItems = obj.getUpdatedVariantLineItems(id, updates[id]['quantity'], updates[id]['preOrder']);
                        var newLineItemsCount = newLineItems.length;
                        if(newLineItemsCount){
                            for(var j = 0; j < newLineItems.length; j++){
                                Cart.addItem(id, newLineItems[j]['quantity'],newLineItems[j]['properties'],function(){
                                    if(--newLineItemsCount <= 0) goToNextLineItem();//all the line items have been added
                                });
                            }
                        }else{
                            goToNextLineItem();//no line items of this variant
                        }
                    });
                };
                ItemUpdater();
            };
            this.getUpdatedVariantLineItems = function(variantId, newQty, newPoQty){
                var propertyName = Config.getLinePropertyName();
                var updateLineItemQuantities = function(lineItems, qtys){
                    var setItemQty = function(itemId, qty, poqty){
                        lineItems[itemId]['quantity'] = qty;
                        if(poqty){
                            if(!lineItems[itemId]['properties']){
                                lineItems[itemId]['properties'] = {};
                            }
                            lineItems[itemId]['properties'][propertyName] = poqty;
                        }else if( lineItems[itemId]['properties'] && lineItems[itemId]['properties'][propertyName]) {
                            delete lineItems[itemId]['properties'][propertyName];
                        }
                    };
                    var poqty = newPoQty;
                    for(var i = 0; i< qtys.length; i++){
                        if(typeof variantLineItems[i] !== "undefined"){
                            if(poqty > 0){
                                poqty -= qtys[i];
                                if(poqty >= 0){
                                    setItemQty(i,qtys[i],qtys[i]);
                                }else{
                                    setItemQty(i,qtys[i], poqty + qtys[i]);
                                }
                            }else{
                                setItemQty(i,qtys[i],0);
                            }
                        }
                    }
                    return lineItems;
                };
                var getLineItems = function(liquidItems, varId){
                    var lineItems = [];
                    for(var i in liquidItems){
                        var lineItem = liquidItems[i];
                        if(lineItem.variant_id == varId){
                            lineItems.push({id: lineItem.id, quantity: lineItem.quantity, properties: lineItem.properties});
                        }
                    }
                    return lineItems;
                };
                var combineLineItemsWithTheSameProperties = function(lineItems){
                    var combinedLineItems = [];
                    var duplicateIndexes = [];
                    var isTheSameProperties = function(objA, objB){
                        if(!objA.properties && !objB.properties)
                            return true;
                        if(!objA.properties || !objB.properties)
                            return false;
                        if(Object.keys(objB.properties).length >= Object.keys(objA.properties).length && objA.properties.hasOwnProperty(propertyName)){//replace objects and check the longer one
                            var tmp = objA;
                            objA = objB;
                            objB = tmp;
                        }
                        for(var key in objA.properties){
                            var value = objA.properties[key];
                            if(key != propertyName && objA.properties.hasOwnProperty(key)){
                                if(!objB.properties.hasOwnProperty(key) || objB.properties[key] != value)
                                    return false;
                            }
                        }
                        return true;
                    };
                    for(var j=0; j<lineItems.length; j++){
                        if(duplicateIndexes.indexOf(j) === -1){
                            for(var k=j+1; k<lineItems.length; k++){
                                if(isTheSameProperties(lineItems[j],lineItems[k])){
                                    duplicateIndexes.push(k);
                                    lineItems[j]['quantity'] = lineItems[j]['quantity'] + lineItems[k]['quantity'];
                                    if(!lineItems[j]['properties']){
                                        lineItems[j]['properties'] = {};
                                        lineItems[j]['properties'][propertyName] = 0;
                                    }
                                    lineItems[j]['properties'][propertyName] += (lineItems[k]['properties'] && lineItems[k]['properties'][propertyName]) ? parseInt(lineItems[k]['properties'][propertyName]) : 0;
                                }
                            }
                        }
                    }
                    for(var m=0; m<variantLineItems.length; m++){
                        if(duplicateIndexes.indexOf(m) === -1) combinedLineItems.push(variantLineItems[m]);
                    }
                    return combinedLineItems;
                };
                var variantLineItems = getLineItems(items, variantId);
                var qtys = this.getVariantQtys(variantId);
                variantLineItems = updateLineItemQuantities(variantLineItems,qtys);
                variantLineItems = combineLineItemsWithTheSameProperties(variantLineItems);
                return variantLineItems;
            };
            this.checkout = function(ev){
                var button = ev.target;
                if(button.name == 'goto_pp'){
                    var formAction = form.attr("action");
                    var action = (formAction.indexOf('?') >= 0) ? formAction + "&" : formAction + "?";
                    form.attr("action", action + button.name );
                    $('<input/>', {
                        'name': button.name,
                        'type': 'hidden'
                    }).appendTo(form);
                    form.submit();
                }else if(button.id !== undefined && button.id.indexOf('AmazonPayments') !== -1){
                    $('<input/>', {
                        'name': 'goto_amazon_payments',
                        'type': 'hidden',
                        'value': 'amazon_payments'
                    }).appendTo(form);
                    form.submit();
                }else if(typeof button.dataset !== 'undefined' && typeof button.dataset['tieredPricingCheckoutButton'] !== 'undefined'){
                    Spurit.tieredPricing.makeCheckout();
                }else{
                    var discountField = $('input[name="discount"]').first();
                    var discount = discountField.length ? discountField.val() : '';
                    app.goToCheckout(discount);
                }
            };
            this.initVariants = function(products){
                for(var i in items){
                    var item = items[i];
                    if((typeof item === "object") && !VariantsRegistry.has(item.variant_id)){
                        VariantsRegistry.add(new Variant(item.variant_id, products[item.product_id]));
                    }
                }
            };
            this.initButtons = function(){
                var qtyElements;
                setTimeout(function(){
                    qtyElements = $(Config.getCartQuantitySelector(''));
                    if(!qtyElements.length){
                        throw new Error('Cart quantity selectors were not detected');
                    }
                    var event = 'mousedown touchstart';
                    var eventCallback = function(ev){
                        if(ev.which < 2) {
                            inProgress = false;
                            obj.processButtonClick(function () {
                                ev.preventDefault();
                                obj.checkout(ev);
                            }, function () {
                                ev.preventDefault();
                                inProgress = true;
                            });
                        }
                    };
                    var selectors = '[name=checkout],[name=goto_pp],.amazon-payments-pay-button';
                    $('body').on(event,'[data-tiered-pricing-checkout-button]',function (ev) {
                        $('body').off(event,selectors,eventCallback);
                        eventCallback(ev);
                    });
                    $(selectors).on(event, eventCallback);
                    if(Config.hasCustom('trackUpdateButton')){
                        $('[name="update"]').on(event, function(ev){
                            if(ev.which < 2) {
                                obj.processButtonClick(function () {
                                    ev.preventDefault();
                                    app.reload();//update only pre-ordered items (regular items update will be ignored in this case)
                                }, function () {
                                    ev.preventDefault();
                                });
                            }
                        });
                    }
                },500);
            };
            this.getQuantity = function(id){
                var qty = 0;
                var qtys = this.getVariantQtys(id);
                for(var i=0; i<qtys.length; i++){
                    qty += qtys[i];
                }
                return qty;
            };
            this.getVariantQtys = function(id){
                var qtys = [];
                var inputs = document.querySelectorAll(Config.getCartQuantitySelector(id));
                $(inputs).each(function(){
                    qtys.push(Math.abs($(this).val()));
                });
                return qtys;
            };
            this.init();
        };

        var BasePreorder = function(product, params){
            params = params || {};
            var obj = this;
            this.variant, this.addToCartButton, this.naMessage, this.poButton, this.variantSelect, this.quantityInput, this.adminIframe, this.variantUiSelects = undefined;
            this.isAvailable = null;
            if(product.id == undefined) throw new Error('Product object does not exist');
            this.getProductId = function(){ return product.id; };
            this.init = function(){
                if(Config.isPreOrderIgnored(product.id)){
                    this.showStandardButton();
                    return false;
                }
                this.poButton = new PreOrderButton(this.addToCartButton,params,function(ev){
                    if(Config.hasCustom('trackLineItemProperties')){
                        obj.processSubmit(ev);
                    }else{
                        obj.processPreOrder(ev);
                    }
                });
                this.addToCartButton.on('mousedown touchstart', function(ev){
                    if(ev.which < 2) {
                        if(Config.hasCustom('trackLineItemProperties')){
                            obj.processSubmit(ev);
                        }else{
                            $(this).off('click.spo');
                            var shouldBeStopped = obj.processAddToCart(ev);
                            if((shouldBeStopped === false) && (navigator.userAgent.indexOf("Safari") > -1)){
                                $(this).on('click.spo', function(ev){
                                    return false;
                                });
                            }
                        }
                    }
                });
                this.initVariants();
                this.variantSelect = $(this.getSelector('variant_selector')).first();
                this.quantityInput = $(this.getSelector('quantity_selector'));
                this.subscribeOnVariantUpdate();
                this.updateVariant(true);
            };
            this.initVariants = function(){
                for(var i = 0; i < product.variants.length; i++ ){
                    var item = product.variants[i];
                    VariantsRegistry.addWithKey(item.title, new Variant(item.id, product));
                }
            };
            this.getVariantUiSelects = function(){
                if((this.variantUiSelects === undefined) || !this.variantUiSelects.length){
                    this.variantUiSelects = $(this.getOptionsSelector(product.id));
                }
                return this.variantUiSelects
            };
            this.subscribeForVariantSelectors = function(){
                obj.getVariantUiSelects().on('change', function () {
                    obj.updateVariant();
                });
            };
            this.subscribeOnVariantUpdate = function(){
                if(Config.hasCustom('variantsUpdateTimeout')){
                    setTimeout(function(){
                        obj.subscribeForVariantSelectors();
                    },Config.getCustom('variantsUpdateTimeout'));
                }else if(Config.hasCustom('manualStart')){
                    obj.subscribeForVariantSelectors();
                }else{
                    $(window).on('load',function(){
                        obj.subscribeForVariantSelectors();
                    });
                }
            };
            this.showNotAvailableMessage = function(){
                var message = Config.getVariantOrGlobalValue(this.variant.getProductId(),this.variant.getId(),'po_not_available_message');
                if(message !== undefined && message.length){
                    if(this.naMessage !== undefined){
                        this.naMessage.html(message);
                        this.naMessage.show();
                    }else{
                        this.naMessage = $('<span class="spo-na-message">'+message+'</span>');
                        this.addToCartButton.after(this.naMessage);
                    }
                }
            };
            this.hideNotAvailableMessage = function(){
                if(this.naMessage !== undefined){
                    this.naMessage.hide();
                }
            };
            this.showStandardButton = function(){
                this.hideNotAvailableMessage();
                if(this.poButton !== undefined){
                    this.hidePoButton();
                }
                this.addToCartButton.removeClass('spo-hidden');
                this.addToCartButton.show();
            };
            this.showPoButton = function(){
                this.hideNotAvailableMessage();
                this.addToCartButton.addClass('spo-hidden');
                this.poButton.show(this.variant);
            };
            this.hidePoButton = function(){
                if(this.poButton !==undefined){
                    this.poButton.hide();
                }
            };
            this.destroyPoButton = function(){
                if(this.poButton !==undefined){
                    this.poButton.destroy();
                }
                this.poButton = undefined;
            };
            this.hideButtons = function(){
                if(this.addToCartButton != undefined) this.addToCartButton.addClass('spo-hidden');
                this.hidePoButton();
                this.showNotAvailableMessage();
            };
            this.updateButton = function(){
                if(this.variant.getStock() <= 0){
                    this.isAvailable = this.variant.trackingEnabled() ? false : true;
                    if(this.variant.isPreOrderEnabled()){
                        if(app.geoAllowedSync() && Config.isPreOrderPossible(product.id,this.variant.getId(), this.variant.getNewStockLevel(this.getQuantity()))){
                            this.showPoButton();
                        }else{
                            this.hideButtons();
                        }
                    }else{
                        this.showStandardButton();
                    }
                }else{
                    this.isAvailable = true;
                    this.showStandardButton();
                }
            };
            this.processAddToCart = function(ev){
                app.loader();
                var qty = this.getQuantity();
                var newQty = this.variant.getNewStockLevel(qty);
                if(newQty < 0 && this.variant.isPreOrderEnabled()){
                    ev.preventDefault();
                    var preOrderQty =  this.variant.getPreOrderQty(qty);
                    if(app.geoAllowedSync() && Config.isPreOrderPossible(product.id,this.variant.getId(), newQty)){
                        app.confirm(Config.getPreOrderConfirmMessage(this.variant.getStock()), function(){
                            Cart.addPreOrder(obj.variant.getId(),qty, preOrderQty, function(){
                                app.goToCart();
                            });
                        }, function(){ app.loader(); });
                    }else{
                        app.alert(Config.getLimitExceededMessage(this.variant));
                    }
                    return false;
                }else{
                    app.loader();
                    return true;
                }
            };
            this.processPreOrder = function(ev){
                ev.preventDefault();
                app.loader();
                var qty = this.getQuantity();
                var preOrderQty = this.variant.getPreOrderQty(qty);
                var newQty = this.variant.getNewStockLevel(qty);
                if(app.geoAllowedSync() && Config.isPreOrderPossible(product.id,this.variant.getId(),newQty)){
                    Cart.addPreOrder(this.variant.getId(),qty,preOrderQty, function(){
                        if(Config.isInStockEnabled()){
                            app.goToCart();//todo interact with instock
                        }else{
                            app.goToCart();
                        }
                    });
                }else{
                    app.alert(Config.getLimitExceededMessage(this.variant));
                }
            };
            this.processSubmit = function(ev){
                app.loader();
                var qty = this.getQuantity();
                var newQty = this.variant.getNewStockLevel(qty);
                if(newQty < 0 && this.variant.isPreOrderEnabled()){
                    var preOrderQty =  this.variant.getPreOrderQty(qty);
                    if(app.geoAllowedSync() && Config.isPreOrderPossible(product.id,this.variant.getId(), newQty)){
                        var propertyInput = $('input[name="'+Config.getLinePropertyName()+'"]').first();
                        if(!propertyInput.length){
                            propertyInput = $('<input type="hidden" name="properties['+Config.getLinePropertyName()+']" value="'+ preOrderQty +'"/>');
                            this.addToCartButton.before(propertyInput);
                        }else{
                            propertyInput.val(preOrderQty);
                        }
                        app.loader();
                    }else{
                        ev.preventDefault();
                        app.alert(Config.getLimitExceededMessage(this.variant));
                    }
                }else{ app.loader(); }
            };
            this.getVariantIdByPrimaryKey = function(key){
                var currentVariant = VariantsRegistry.get(key);
                if(!currentVariant) throw new Error('Can not get variant ID. It might be a problem with variant selects');
                return currentVariant.getId();
            };
            this.getCurrentVariantId = function(initial){
                var id;
                var options = [];
                if( !initial && Config.hasCustom('customVariantSelectors')){
                    obj.getVariantUiSelects().each(function(){
                        options.push($(this).val());
                    });
                    id = obj.getVariantIdByPrimaryKey(options.join(' / '));
                } else if ( !initial && Config.hasCustom('customVariantRadios') ) {
                    obj.getVariantUiSelects().each(function(){
                        if ( $(this).prop('checked') ) {
                            options.push($(this).val());
                        }
                    });
                    id = obj.getVariantIdByPrimaryKey(options.join(' / '));
                } else{
                    id = this.variantSelect.val();
                    if(!id){
                        id = product.variants[0].id;
                    }
                }
                return id;
            };
            this.getQuantity = function(){
                if(this.quantityInput.length){
                    return Math.abs(this.quantityInput.val());
                }else{
                    return 1;
                }
            };
            this.updateVariant = function(initial,vid){
                vid = vid || 0;
                initial = (initial && !Config.hasCustom('emptyInitialVariant')) || false;
                try{
                    vid = vid ? vid : this.getCurrentVariantId(initial);
                    if(this.variant === undefined || this.variant.getId() !== vid ){
                        this.variant = new Variant(vid, product);
                    }
                    if( this.variant == undefined) throw new Error('Product variant can not be null');
                    this.updateButton();
                }catch (e){
                    this.hideNotAvailableMessage();
                    this.hidePoButton();
                }
            };
            this.isVariantAvailable = function(){
                this.updateVariant();
                return this.isAvailable;
            };
            this.getSelector = function(selector){
                return Config.getSelector(selector);
            };
            this.getOptionsSelector = function(productId){
                return Config.getOptionsSelector(productId);
            };
            this.run = function(){
                this.addToCartButton = $(obj.getSelector('addtocart_selector')).first();
                if(this.addToCartButton.length){
                    this.init();
                }else{
                    setTimeout(function(){
                        obj.addToCartButton = $(obj.getSelector('addtocart_selector')).first();
                        if(!obj.addToCartButton.length) throw new Error('Add to cart button was not detected');
                        obj.init();
                    },2000);
                }
            };
        };

        var ProductPreorder = function(product, params){
            BasePreorder.apply(this, arguments);
            this.run();
        };

        var CollectionPreorder = function(product, params){
            var defaultParams = {
                tooltip : false,
                quantity : false,
                variants : false,
                selectorPrefix: '.spo-product-' + product.id + ' '
            };
            BasePreorder.apply(this, arguments);
            params = $.extend(defaultParams, params);
            this.getSelector = function(selector){
                return params.selectorPrefix + Config.getSelector(selector, false);
            };
            this.getOptionsSelector = function(productId){
                var selector = Config.getOptionsSelector(productId, false);
                if(selector.indexOf(',') !== -1){
                    selector = selector.replace(new RegExp(',', 'g'), ', ' + params.selectorPrefix);
                }else{
                    selector = params.selectorPrefix + selector;
                }
                return selector;
            };
            if(!params.quantity){
                this.getQuantity = function(){ return 1; };
            }
            if(!params.variants){//stubs for regular methods
                this.initVariants = function(){};
                this.subscribeOnVariantUpdate = function(){};
                this.getCurrentVariantId = function(){ return product.variants[0].id; };
            }else{//redeclaration of some specific methods
                this.subscribeOnVariantUpdate = function(){
                    this.subscribeForVariantSelectors();
                };
                this.getVariantIdByPrimaryKey = function(key){
                    var currentVariant = VariantsRegistry.get(product.id+key);
                    if(!currentVariant) throw new Error('Can not get variant ID. It might be a problem with variant selects');
                    return currentVariant.getId();
                };
                this.initVariants = function(){
                    for(var i = 0; i < product.variants.length; i++ ){
                        var item = product.variants[i];
                        VariantsRegistry.addWithKey(product.id + item.title, new Variant(item.id, product));
                    }
                };
                if(this.getOptionsSelector(product.id) == this.getSelector('variant_selector')){
                    this.getCurrentVariantId = function(){//the same hidden and visible select
                        var id = this.variantSelect.val();
                        if(!id){
                            id = product.variants[0].id;
                        }
                        return id;
                    }
                }
            }
            this.run = function(){
                this.addToCartButton = $(this.getSelector('addtocart_selector')).first();
                if(this.addToCartButton.length){
                    this.init();
                }
            };
            this.run();
        };

        var QuickViewPreorder = function(product, params){
            BasePreorder.apply(this, arguments);
            this.subscribeOnVariantUpdate = function(){
                this.subscribeForVariantSelectors();
            };
            this.run();
        };

        var PreordersRegistry = (function () {
            return {
                preorders: {
                    product: undefined,
                    quickView: undefined,
                    collection: {}
                },
                add: function (type, preorder) {
                    if(type == 'quickView'){
                        this.preorders.quickView = preorder;
                    }else if(type == 'collection'){
                        this.preorders.collection[preorder.getProductId()] = preorder;
                    }else{
                        this.preorders.product = preorder;
                    }
                },
                get: function (type, productId) {
                    productId = productId || 0;
                    var res = undefined;
                    if(typeof this.preorders[type] !== 'undefined'){
                        if(type == 'collection' && typeof this.preorders[type][productId] !== 'undefined'){
                            res = this.preorders[type][productId];
                        }else{
                            res = this.preorders[type];
                        }
                    }
                    return res;
                },
                has: function (type,productId) {
                    productId = productId || 0;
                    return this.get(type, productId) !== undefined;
                },
                remove: function(type,productId){
                    productId = productId || 0;
                    if(this.has(type,productId)){
                        if(productId && type=='collection'){
                            this.preorders[type][productId] = undefined;
                        }else{
                            this.preorders[type] = undefined;
                        }
                    }
                }
            }
        })();

        window.spoProduct = {};//public api
        if(app.getPageType() == 'product' && !Config.hasCustom('manualStart')){
            PreordersRegistry.add('product', new ProductPreorder(SPOParams.product));
        }
        if(app.getPageType() == 'cart'){
            var preorder = new CartPage(SPOParams);
        }
        spoProduct.run = function (product, params){
            params = params || {};
            params.type = typeof params.type === 'undefined' ? 'product' : params.type;
            if(params.type == 'quickView'){
                PreordersRegistry.add('quickView', new QuickViewPreorder(product,params));
            }else if(params.type == 'collection'){
                PreordersRegistry.add('collection', new CollectionPreorder(product,params));
            }else{
                PreordersRegistry.add('product', new ProductPreorder(product,params));
            }
            return this;
        };
        spoProduct.updateVariant = function(vid){//product page only
            var preorder;
            if(PreordersRegistry.has('product')){
                preorder = PreordersRegistry.get('product');
            }else if(PreordersRegistry.has('quickView')){
                preorder = PreordersRegistry.get('quickView');
            }
            if(preorder){
                vid = vid || 0;
                preorder.updateVariant(false,vid);
            }
        };
        spoProduct.quickView = function(product){//quick view popup
            this.flush();
            this.run(product, {type: 'quickView'});
            return this;
        };
        spoProduct.flush = function(){//quick view only
            if(PreordersRegistry.has('quickView')){
                var preorder = PreordersRegistry.get('quickView');
                preorder.destroyPoButton();
                PreordersRegistry.remove('quickView');
            }
            return this;
        };
        spoProduct.isAvailable = function(){//product page only
            var isAvailable = null;
            try{ isAvailable = PreordersRegistry.get('product').isVariantAvailable(); }catch(e){}
            return isAvailable;
        };
        spoProduct.setConfigValue = function(key, value){
            Config.setValue(key,value);
            return this;
        };
    };

    try{
        if ( typeof jQuery === 'undefined' || (jQuery.fn.jquery.split(".")[0] < 2 && jQuery.fn.jquery.split(".")[1] < 7)) {
            var doNoConflict = true;
            if (typeof jQuery === 'undefined') {doNoConflict = false;}
            loadScript('ajax/libs/jquery/1.8/jquery.min.js', function(){
                if (doNoConflict) {
                    jQuery17 = jQuery.noConflict(true);
                } else {
                    jQuery17 = jQuery;
                }
                app.init(jQuery17);
            });
        } else {
            app.init(jQuery);
        }
    }
    catch (e){ console.log('Pre-order app exception: ' + e)}

    if (document.location.search.indexOf('sign=pre-order') !== -1) {
        loadScript('shopify-apps/Plugins/SelectorPicker/selector-picker.js',function(){});
    }
})();