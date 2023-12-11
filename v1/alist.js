// Alist https://atlist-v3.apifox.cn/
// Fetch https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API

import { Helper } from './helper.js';

/**
 * Alist
 * 
 * @author 东子 <xhwsd@qq.com>
 * 
 * @property {string} url ALIST基础网址
 * @property {string} token 当前用户令牌
 */
export class Alist {
    /**
     * 构造
     * 
     * @param {string} url ALIST基础网址
     */
    constructor(url) {
        this.url = Helper.removeEnd(url);
        this.token = '';
    }

    /**
     * 请求
     * 
     * @param {string} url url 子网址，请以`/`开始
     * @param {object|null} data POST数据
     * @returns {object} 返回数据对象
     */
    async request(url, data = null)
    {
        let init = {headers: {}};
        if (data) {
            init.method = 'POST';
            init.headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(data);
        }
        if (this.token) {
            init.headers['Authorization'] = this.token;
        }
        let response = await fetch(this.url + url, init).then(function(response) { 
            return response.json();
        });
        if (response.code != 200) {
            throw new Error(`调用ALIST接口${url}失败，${response.message}`);
        }
        return response.data;
    }

    /**
     * 用户登录 - `/api/auth/login`
     * 
     * @param {string} username 用户
     * @param {string} password 密码
     * @param {string} otpCode 二步验证码
     * @returns {object} 返回数据对象
     */
    async login(username, password, otpCode = '') {
        let data = await this.request('/api/auth/login', {
            username: username,
            password: password,
            otp_code: otpCode
        });
        if (typeof data === 'object') {
            this.token = data.token;  
        }
        return data;
    }

    /**
     * 取用户资料 - `/api/me`
     * 
     * @returns {object} 返回数据对象
     */
    async getUserProfile() {
        return await this.request('/api/me');
    }

    /**
     * 取文件列表 - `/api/fs/list`
     * 
     * @param {string} path 路径，请以`/`开始
     * @param {string} password 密码
     * @param {number} page 页数
     * @param {number} perPage 每页数目，0为所有
     * @param {bool} refresh 是否强制刷新
     * @returns {object} 返回数据对象
     */
    async getFileList(path = '', password = '', page = 1, perPage = 0, refresh = false) {
        return await this.request('/api/fs/list', {
            path: path,
            password: password,
            page: page,
            per_page: perPage,
            refresh: refresh
        });
    }

    /**
     * 取文件信息 - `/api/fs/get`
     * 
     * @param {string} path 路径，请以`/`开始
     * @param {string} password 密码
     * @returns {object} 返回数据对象
     */
    async getFileInfo(path = '', password = '') {
        return await this.request('/api/fs/get', {
            path: path,
            password: password,
        });
    }

    /**
     * 到文件下载地址
     * 
     * @param {string} path 路径
     * @param {string} name 名称
     * @param {string} sign 签名
     * @returns {string} 下载地址
     */
    toDownloadUrl(path, name, sign = '') {
        // 网站/d/路径/文件名?sign=签名
        let url = this.url + '/d' + Helper.completeStart(path) + '/' + Helper.removeStart(name);
        if (sign) {
            url += '?sign=' + sign;
        }
        return url;
    }

    /**
     * 取文件下载地址
     * 
     * @param {string} path 路径
     * @param {Object} item 内容项目
     * @returns {string} 下载地址
     */
    getDownloadUrl(path, item) {
        return this.toDownloadUrl(path, item.name, item.sign || '');
    }
}