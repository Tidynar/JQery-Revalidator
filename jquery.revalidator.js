/**
 * @link http://www.amterlek.com/revalidator.html
 * @copyright Copyright (c) 2015 Ruslan I.
 * @license LICENSE.txt
 */
;(function($) {
    var pluginName = 'revalidator';

    /**
     * constructor
     */
    function Plugin(element, options) {
        var el = element; //DOM element
        var $el = $(element); //JQuery element

        /**
         * plugin registry
         * @type {{object}}
         */
        var variables = { validated: 'no' };

        // extend default options with those supplied by user.
        options = $.extend({}, $.fn[pluginName].defaults, options);

        /**
         * init
         */
        function init() {

            if($el.is('form')) {
                bindForm();
            } else {
                console.log('it is not form!');
            }

            hook('beforeInit');
        }


        /**
         * public methods
         */
        function bindForm() {
            console.log('binding Form...');
            $el.on('submit.revalidator', function (e) {
                e.preventDefault();

                var validated = validateForm();

                if(validated === true) {
                    /**
                     * Что бы ajax функции могли перехватывать обработку сабмита
                     * если false - то делаем сабмит формы, если true - то сабмит сделаем уже скриптом
                     */
                    if(options.jsSubmit === false) {
                        $el.unbind('submit.revalidator');

                        /**
                         * Если есть сабмит кнопка - то делаем невидимый инпут с значением из кнопки сабмита и сабмитим форму
                         */
                        var submit_btn = $el.find('[type="submit"]');

                        if(submit_btn !== undefined) {
                            if(submit_btn.attr('name')) {
                                $el.append(
                                    $("<input type='hidden'>").attr( {
                                        name: submit_btn.attr('name'),
                                        value: submit_btn.attr('value') })
                                );
                            }
                        }
                        //console.log('form submittted~');
                        $el.trigger('submit');
                    }
                }
            });

            $.each($el.find(':input'), function (index, value) {
                var input = $(this);

                console.log(input);
                console.log('binded');

                if (input.is("[data-rev]") || input.is("[data-req]")) {
                    if(input.attr('data-rev') == 'file'
                        || input.attr('data-req') == 'file'
                        || input.attr('data-rev') == 'select'
                        || input.attr('data-req') == 'select'
                        || input.attr('data-req') == 'checkbox'
                        || input.attr('data-rev') == 'checkbox') { //если - file или select-box

                        input.unbind('change'); //убираем прошлое
                        input.bind('change', function () {
                            checkInput(input);
                        });
                    } else { //если это текстовое поле - и вообще то, что вводят
                        input.unbind('keyup'); //убираем прошлое
                        input.bind('keyup', function () {
                            checkInput(input);
                        });
                    }

                }
            });
        }

        function validateForm() {
            //console.log('checkform...');
            var result = true;

            $.each($el.find(':input'), function (index, value) {
                var input = $(this);

                if (input.is("[data-rev]") || input.is("[data-req]")) {
                    // здесь так должно быть, писать result = checkInput(input); - не надо
                    if(checkInput(input) === false) {
                        result = false;
                    }
                }

            });

            if(result) {
                variable('validated', 'yes');
            } else {
                variable('validated', 'no');
            }


            return result;
        }

        /**
         * Для проверки инпута
         *
         * @param input объект инпута
         * @returns {boolean}
         */
        function checkInput(input) {
            //console.log('************************************');
            console.log('checking iput...');
            //console.log(input);
            var required = input.is("[data-req]"); //required or not - true or false
            var type;
            //тип определится в любом случае - какой бы не был задан req или rev.
            //но в случае когда есть dep - то надо ставить rev



            if(required === true) {
                type = input.attr('data-req');
            } else {
                type = input.attr('data-rev');
            }

            if(type == undefined) {
                type = "text";
            }

            if(!required) { //if false
                required = __checkDependencies(input);
            }

            //console.log(input);
            //console.log(required);

            var err_text = input.attr('data-rev-text');

            var result_error = 0;

            //console.log("Проверяем, имеет ли какое либо значение этот инпут");
            //console.log(input);
            //console.log('Результат:');
            //console.log(checkIsFilled(input, type));


            if(required || ( (checkIsFilled(input, type) && !required) )) { //нужен или (не пустой и не нужен)), то проверяем

                if (err_text === undefined) err_text = options.errorText;
//console.log('входим в проверку, проверяем след инпут:');
                //console.log(input);
                //console.log('он имеет тип:'+ type);

                if (type === 'text') {
                    if (checkAny(input) === false) result_error++;
                } else if (type === 'email') {
                    if (checkMail(input) === false) result_error++;
                } else if (type === 'phone') {
                    if (checkPhone(input) === false) result_error++;
                } else if (type === 'sum') {
                    if (checkSum(input) === false) result_error++;
                } else if (type === 'file') {
                    if (checkAny(input) === false) result_error++;
                } else if (type === 'checkbox') {
                    if (checkChecked(input) === false) result_error++;
                } else if (type === 'select') {
                    if (checkSelected(input) === false) result_error++;
                } else if (type === 'rusdate') {
                    if (checkRusDate(input) === false) result_error++;
                } else if (type === 'time') {
                    if (checkTime(input) === false) result_error++;
                } else if (type === 'textarea') {
                    if (checkTextarea(input) === false) result_error++;
                } else if (type === 'cketext') {
                    if (checkCkeText(input) === false) result_error++;
                } else {
                    if (checkAny(input) === false) result_error++;
                }

            }
            //console.log(result_error);

            // + нужно создать красивые алерты когда что то добавили кудато

            cleanInput(input);

            if(result_error > 0) {
                //console.log('Да, инпут имеет ошибку, делаем добавление инпут еррора');
                __addInputError(input, err_text);

                return false;
            } else {
                removeInputError(input);

                /* experimental */

                var target = getCkeObjectTextareaOfInput(input);
                if(target.length >0) {
                    __addSuccessClass(target);
                } else {
                    __addSuccessClass(input);
                }

                return true;
            }
        }

        /**
         * Проверка - заполнен ли инпут
         *
         * @param input
         * @param type string тип
         * @returns {boolean}
         */
        function checkIsFilled(input, type) {
            if(type == "select") {
                return checkSelected(input);
            } else if(type == "checkbox") {
                return checkChecked(input);
            } else {
                return checkAny(input);
            }
        }

        /**
         * Проверка - имеет ли хоть какой ни будь символ. Если имеет то true
         *
         * @param input
         * @returns {boolean}
         */
        function checkAny(input) {
            return input.val().length > 0;
        }
        /**
         * Проверка - является ли емейлом
         *
         * @param input
         * @returns {boolean}
         */
        function checkMail(input) {
            var reg = /^([A-Za-z0-9_\-\.])+@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
            return reg.test(input.val());
        }
        /**
         * Проверка - является ли телефоном
         *
         * @param input
         * @returns {boolean}
         */
        function checkPhone(input) {
            var reg = /^[\(\)\d\+\-]+$/;
            return reg.test(input.val());
        }
        /**
         * Проверка - является ли числом с плавающей точкой/просто числом (суммой)
         *
         * @param input
         * @returns {boolean}
         */
        function checkSum(input) {
            //console.log('проверка на сумму');
            var reg = /^(\d+(\.\d+)?)$/;
            ////console.log(input);

            ////console.log(reg.test(input.val()));
            return reg.test(input.val());
        }
        /**
         * Проверка - активирован ли checkbox (стоит ли галочка)
         *
         * @param input
         * @returns {boolean}
         */
        function checkChecked(input) {
            //console.log('проверка на checked');
            return  input.prop('checked');
        }
        /**
         * Проверка - выбрана ли опция в селект-боксе
         *
         * @param input
         * @returns {boolean}
         */
        function checkSelected(input) {
            //console.log('проверка на selected');
            return input[0].selectedIndex > 0;
        }
        /**
         * Проверка на русскую дату 10.09.2015 dd.mm.yyyy
         *
         * @param input
         * @returns {boolean}
         */
        function checkRusDate(input) {
            //console.log('проверка на дату');
            var reg = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
            ////console.log(input);

            ////console.log(reg.test(input.val()));
            return reg.test(input.val());
        }
        /**
         * Проверка на время 10:33 HH:mm
         *
         * @param input
         * @returns {boolean}
         */
        function checkTime(input) {
            //console.log('проверка на дату');
            var reg = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
            ////console.log(input);

            ////console.log(reg.test(input.val()));
            return reg.test(input.val());
        }

        /**
         * Проверка textarea
         *
         * @param input
         * @returns {boolean}
         */
        function checkTextarea(input) {
            return input.html > 0;
        }


        /**
         * Проверка cke editor
         *
         * @experimental
         * @param input
         * @returns {boolean}
         */
        function checkCkeText(input) {
            ////console.log(input);

            if(input.is('[id]') == false) {
                //console.log('Если это cke - то нужно что бы был id с таким же id который указывался при вызове cke');
                return false;
            }

            var text = CKEDITOR.instances[input.attr('id')].getData();

            return text.length > 0;
        }

        function getCkeObjectTextareaOfInput(input) {
            var cke_editor_object = 0;
            if(input.is('[id]')) {
                cke_editor_object = $('.cke_editor_' + input.attr('id'));
            }
            if(cke_editor_object.length > 0) {
                return cke_editor_object.find('.cke_contents');
            } else {
                return false;
            }
        }




        /**
         * Private methods
         */

        /**
         * Проверяем зависимости
         * @param input
         * @returns {boolean}
         * @private
         */
        function __checkDependencies(input) {
            console.log('проверяем есть ли зависимость');
            console.log(input);

            /*var depending_item = $('[data-rev-dep~="' + input.attr('id') + '"]');
Потом можно изучить это и сделать на ходу определение зависимых полей
            if(depending_item.length > 0) {
                console.log('есть зависящие вещи');
                var pre_dep_check_result = true;
                $.each(depending_item, function() {
                    if(checkInput($(this)) === false) {
                        dep_check_result = false;
                    }
                });
                return pre_dep_check_result;
            }*/

            if(input.is("[data-rev-dep]")) {
                console.log('есть зависимость, едем дальше');
                console.log("#" + input.attr("data-rev-dep"));

                var dependencies_desc = input.attr("data-rev-dep");
                var dependencies_array = dependencies_desc.split(' ');
                var dep_check_result = false;

                $.each(dependencies_array, function(key, dep_object_id) {
                    var dependency_object = $("#" + dep_object_id.trim());
                    var dependency_object_type;
                    console.log(dependency_object);

                    if(dependency_object.is("[data-req]")) {
                        dependency_object_type = dependency_object.attr("data-req");
                    } else if(dependency_object.is("[data-rev]")) {
                        dependency_object_type = dependency_object.attr("data-rev");
                    } else {
                        console.log('011 Bad news - dependency object с id ' + dependency_object.attr('id') + ' не имеет data-req или data-rev, нужно указать');
                    }

                    if(dependency_object_type == 'select') {
                        console.log('^проверяем, имеет ли данные наш зависимый {select} объект - ответ:' + checkAny(dependency_object));
                        if(checkSelected(dependency_object)) {
                            dep_check_result = true;
                        }
                    } else if(dependency_object_type == 'checkbox') {
                        console.log('^проверяем, имеет ли данные наш зависимый {checkbox} объект - ответ:' + checkAny(dependency_object));
                        if(checkChecked(dependency_object)) {
                            dep_check_result = true;
                        }
                    } else {
                        console.log('^проверяем, имеет ли данные наш зависимый {any} объект - ответ:' + checkAny(dependency_object));
                        if(checkAny(dependency_object)) {
                            dep_check_result = true;
                        }
                    }
                });

                return dep_check_result;

                //console.log('зависимый объект это:');
                //console.log(dependency_object);

            }

            return false;
        }


         function __addInputError(input, err_text) {

            var cke_target = getCkeObjectTextareaOfInput(input);
             if(cke_target.length > 0) {
                 cke_target.addClass('error');
             } else {
                 input.addClass('error');
             }



            if(options.errorTextEnabled === true) {
                var errmsg;
                if(input.attr('data-rev-errorclass') !== undefined) {
                    //console.log('ошибка будет с custom-классом');// TODO:: можно сделать что бы в опциях задавать класс ошибки
                    errmsg = '<div class="rv-error ' + input.attr('data-rev-errorclass') + '">' + err_text + '</div>';
                } else {
                    //console.log('ошибка будет иметь ширину как инпут, под которой она находится');//
                    errmsg = '<div class="rv-error ' + options.errorClass + '">' + err_text + '</div>';
                }
console.log(errmsg);
                errmsg = $($.parseHTML(errmsg)); //преобразуем в объект
//console.log(errmsg);
//                console.log('Ошибку создадим для инпута');
//                console.log(input);
                if(input.is('[data-rev-jump]')) {
                    if(input.attr('data-rev-jump') == 'end') {
                        input.parent().append(errmsg); //инпут должен сидеть в инпут боксе, иначе окажется в самом конце :)
                        // иногда смотрится норм, т.к. получается список ошибок
                    }
                } else {
                    console.log(input);
                    console.log('error added' + errmsg);
                    input.after(errmsg); //создаёт саму ошибку
                }



                if($(errmsg).hasClass('auto-width')) {
                    $(errmsg).css({'width': Math.round(input.width()) + 'px'});
                }
            }
        }

        /**
         * Надо запомнить - что удаляет след. элемент в боксе, где находится инпут(input-box). //TODO:: придумать зависмость инпута и ошибки, т.к. пока выглядит плохо
         *
         * @param input
         * @private
         */
         function removeInputError(input) {
            input.removeClass('error');
            if(options.errorTextEnabled === true) {
                var error_obj = input.parent().find('.rv-error');
                if($(error_obj).hasClass('rv-error')) {
                    $(error_obj).remove();
                }
            }
        }
        //this.__hasError = function (input) {
        //    return input.hasClass('error');
        //};
        function __addSuccessClass(input) {
            input.addClass('success');
        }
        function cleanInput(input) {

            var cke_target = getCkeObjectTextareaOfInput(input);
            if(cke_target.length > 0) {
                cke_target.removeClass('error');
                cke_target.removeClass('success');
            } else {
                input.removeClass('success');
            }

            removeInputError(input);


        }
        function cleanAll() {
            $.each($el.find(':input'), function (index, value) {
                var input = $(this);
                cleanInput(input);
            });
        }


        function option (key, val) {
            if (val) {
                options[key] = val;
            } else {
                return options[key];
            }
        }


        function variable (key, val) {
            if (val) {
                console.log('setted');
                variables[key] = val;
            } else {
                console.log('getted');
                return variables[key];
            }
        }

        function destroy() {
            $el.each(function() {
                var el = this;
                var $el = $(this);

                hook('onDestroy');
                $el.removeData('plugin_' + pluginName);
            });
        }

        function hook(hookName) {
            if (options[hookName] !== undefined) {
                options[hookName].call(el);
            }
        }

        init();

        return {
            variable: variable,
            option: option,
            destroy: destroy,
            bindForm: bindForm,
            validateForm: validateForm,
            checkInput: checkInput,
            cleanAll: cleanAll,
            cleanInput: cleanInput
        };
    }

    $.fn[pluginName] = function(options) {
        if (typeof arguments[0] === 'string') {
            var methodName = arguments[0];
            var args = Array.prototype.slice.call(arguments, 1);
            var returnVal;
            this.each(function() {
                if ($.data(this, 'plugin_' + pluginName) && typeof $.data(this, 'plugin_' + pluginName)[methodName] === 'function') {
                    returnVal = $.data(this, 'plugin_' + pluginName)[methodName].apply(this, args);
                } else {
                    throw new Error('Method ' +  methodName + ' does not exist on jQuery.' + pluginName);
                }
            });
            if (returnVal !== undefined){
                return returnVal;
            } else {
                return this;
            }
        } else if (typeof options === "object" || !options) {
            return this.each(function() {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });
        }
    };

    $.fn[pluginName].defaults = {
        errorText : "Please, fill the field",
        errorTextEnabled: true, // if false - plugin don`t shows error below inputs
        errorClass: "error-message auto-width",
        onInit: function() {},
        onDestroy: function() {},
        jsSubmit: false
    };

})(jQuery);
