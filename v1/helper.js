/**
 * 辅助模块
 * 
 * @author 东子 <xhwsd@qq.com>
 */
export class Helper {
    /**
     * 小驼峰属性 - 将短横线名（xxx-xxx-xxx）属性为小驼峰属性名（xxxXxxXxx）
     * 
     * @param {object} attributes 元素属性
     * @param {object} 元素属性
     */
    static camelizeAttributes(attributes)
    {
        let result = {};
        for (var i = 0; i < attributes.length; i++) {
            result[this.camelize(attributes[i].name)] = attributes[i].value;
        }
        return result;
    }

    /**
     * 小驼峰命名
     * 
     * @param {string} str 文本
     * @return {string} 转换结果
     */
    static camelize(string) {
        // 如：list-max-height转为listMaxHeight
        return string.replace(/^[_.\- ]+/, '') // 移除开头 _ . -
            .toLowerCase() // 全部到小写 
            .replace(/[_.\- ]+(\w|$)/g, (m, p1) => p1.toUpperCase()); // 替换 _ . - 后续一个字符转大写
    }

    /**
     * 比对
     * 
     * @param {boolean} asc 升序，是否升序排序 true 为升序，false为降序
     * @param {callback} callback 回调
     * @return {number}
     */
    static compare(asc, callback) {
        if (asc === undefined) {
            asc = 1;
        } else {
            asc = (asc) ? 1 : -1;
        }

        return function(item1, item2) {
            let name1 = callback(item1);
            let name2 = callback(item2);
            if (name1 < name2) {
                return asc * -1;
            } else if (name1 > name2) {
                return asc * 1;
            } else {
                return 0;
            }
        }
    }

    /**
     * 填充
     * 
     * @param {number} number 数值
     * @param {number} length 长度
     * @return {string}
     */
    static padding(number, length) {
       return (Array(length).join('0') + number).slice(-length);
    }

    /**
     * 去除开头关键字
     * 
     * @param {string} content 内容
     * @param {string} keyword 关键字 
     */
    static removeStart(content, keyword = '/') {

        if (content.slice(0, keyword.length) === keyword) {
           return content.slice(keyword.length, content.length - keyword.length + 1);
        } else {
            return content;
        }
    }

    /**
     * 去除结尾关键字
     * 
     * @param {string} content 内容
     * @param {string} keyword 关键字 
     */
    static removeEnd(content, keyword = '/') {
        if (content.slice(-keyword.length) === keyword) {
            return content.slice(0, content.length - keyword.length);
        } else {
            return content;
        }
    }
    
    /**
     * 补全开头关键字
     * 
     * @param {string} content 内容
     * @param {string} keyword 关键字 
     */
    static completeStart(content, keyword = '/') {
        if (content.slice(0, keyword.length) !== keyword) {
           return keyword + content;
        } else {
            return content;
        }
    }

    /**
     * 补全结尾关键字
     * 
     * @param {string} content 内容
     * @param {string} keyword 关键字 
     */
    static completeEnd(content, keyword = '/') {
        if (content.slice(-keyword.length) !== keyword) {
            return content + keyword;
        } else {
            return content;
        }
    }

    /**
     * 加载CSS
     * 
     * @param {string} url 网址
     * @return {Promise|Element}
     */
    static async loadCss(url) {
        let element = document.querySelector('link[href="' + url + '"]');
        if (element) {
            return element;
        } else {
            return new Promise(function(resolve, reject) {
                let element = document.createElement('link');
                element.type ='text/css';
                element.rel = 'stylesheet';
                element.href = url;
                element.onload = element.onreadystatechange = function() {
                    if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                        element.onload = element.onreadystatechange = null;
                        resolve(element);
                    }
                }
                element.onerror = function() {
                    reject(new Error(`CSS(${url})加载失败`));
                }
                document.head.appendChild(element);
            });
        }
    }

    /**
     * 加载JS
     * 
     * @param {string} url 网址
     * @return {Promise|Element}
     */
    static async loadJs(url) {
        let element = document.querySelector('script[src="' + url + '"]');
        if (element) {
            return element;
        } else {
            return new Promise(function(resolve, reject) {
                let element = document.createElement('script');
                element.type = 'text/javascript';
                element.src = url;
                element.onload = element.onreadystatechange = function() {
                    if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                        element.onload = element.onreadystatechange = null;
                        resolve(element);
                    }
                }
                element.onerror = function() {
                    reject(new Error(`JS(${url})加载失败`));
                }
                document.head.appendChild(element);
            });
        }
    }

    /**
     * 派生元素 - 基于容器元素创建子级元素
     * 
     * @param {string} label 标签；容器元素的id、子级元素的类型
     * @param {string} prefix 前缀；属性名称前缀
     */
    static deriveElement(label, prefix) {
        // 支持div标签定义，解决alist中 markdown文档无法完整转换子元素
        let container = document.getElementById(label);   
        if (container && !container.querySelector(label)) {
            // 动态创建子级元素
            let element = document.createElement(label);
            for (let i = 0; i < container.attributes.length; i++) {
                let attribute = container.attributes[i];
                if (attribute.name.indexOf(prefix) === 0) {
                    element.setAttribute(attribute.name.slice(prefix.length), attribute.value);
                }
            }
            container.appendChild(element);
        }
    }
}