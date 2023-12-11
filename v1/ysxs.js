/*
CDN
//unpkg.com/aplayer@1.10.1/dist/APlayer.min.css
//unpkg.com/aplayer@1.10.1/dist/APlayer.min.js
//unpkg.com/axios@1.2.2/dist/axios.js

文档
aplayer https://aplayer.js.org/#/zh-Hans/
MetingJS https://github.com/metowolf/MetingJS
音频 https://www.runoob.com/tags/ref-av-dom.html
JavaScript教程 https://www.runoob.com/js/js-tutorial.html
*/

/*
CDN
//unpkg.com/aplayer@1.10.1/dist/APlayer.min.css
//unpkg.com/aplayer@1.10.1/dist/APlayer.min.js
//unpkg.com/axios@1.2.2/dist/axios.js

文档
aplayer https://aplayer.js.org/#/zh-Hans/
MetingJS https://github.com/metowolf/MetingJS
音频 https://www.runoob.com/tags/ref-av-dom.html
JavaScript教程 https://www.runoob.com/js/js-tutorial.html
*/
import { Alist } from './alist.js';
import { Helper } from './helper.js';

/** 元素标签；注意必须含一个破折号（-） */
const ELEMENT_LABEL = 'ysxs-player';
/** 属性前缀 */
const ATTRIBUTE_PREFIX = 'ysxs-';
/** APlayer.css网址 */
const URL_APLAYER_CSS = '//unpkg.com/aplayer@1.10.1/dist/APlayer.min.css';
/** APlayer.js网址 */
const URL_APLAYER_JS = '//unpkg.com/aplayer@1.10.1/dist/APlayer.min.js';

if (!window.YsxsPlayerElement) {
	/**
	 * 有声小说播放器元素
	 * 
	 * @property {object} options 属性选项
	 * @property {string} options.alistUrl ALIST基础网址
	 * @property {string} options.albumPath 专辑路径
	 * @property {string} options.albumPassword 专辑密码，轨道和封面和封面都基于该密码
	 * @property {string} options.albumName 专辑名称
	 * @property {string} options.artistName 主播名称
	 * @property {string} options.coverPath 封面路径
	 * @property {string} options.trackPath 轨道路径，多个可使用 | 分割 
	 * @property {string} options.trackNumber 音轨编号，按正则表达式从文件名取 
	 * @property {string} options.trackName 音轨名称，按正则表达式从文件名取
	 * @property {string} options.playerFixed 播放器是否开启吸底模式
	 * @property {string} options.playerListFolded 播放器列表是否默认折叠
	 * @property {string} options.playerListMaxLeight 播放器列表最大高度
	 * @property {string} options.debug 是否为调试模式
	 */
	class YsxsPlayerElement extends HTMLElement {
		/**
		 * 连接回调
		 */
		connectedCallback() {
			this.init();
			this.debug('元素对象已连接');
		}

		/**
		 * 断开回调
		 */
		disconnectedCallback() {
			// 清空列表，解决报错
			if (this.aplayer) {
				this.aplayer.list.clear();
				this.aplayer.destroy();
			}
			this.debug('元素对象已断开');
		}

		/**
		 * 初始化
		 */
		init() {
			// 属性转选项
			this.options = Helper.camelizeAttributes(this.attributes);
			this.debug('初始属性选项', '选项=', this.options);

			// 无效专辑目录
			if (!this.options.albumPath && decodeURI(window.location.pathname).slice(-3) === '.md') {
				this.debug('缺省专辑路径无效');
				return;
			}
			
			// 初始化ALIST
			this.alist = new Alist(this.getAlistUrl());

			// 初始加载
			Promise.all([
				Helper.loadCss(URL_APLAYER_CSS),
				Helper.loadJs(URL_APLAYER_JS),
				this.getAudioList(),
				this.getCoverUrl()
			]).then((results) => {
				this.debug('初始加载成功');

				// 所有轨道使用专辑封面
				results[2].forEach((audio) =>{
					audio.cover = results[3];
				});

				this.initPlayer(results[2]);
				this.debug('初始播放器完成');
			}).catch((error) => {
				this.debug('初始加载失败', error);
			});
	
		}

		/**
		 * 取音频列表
		 * 
		 * @returns {Array} 成功列表，失败返回空数组
		 */
		async getAudioList() {
			// 批量取ALIST内容
			let promises = [];
			let paths = this.getTrackPaths();
			paths.forEach((path) => {
				promises.push(this.alist.getFileList(
					this.getAlbumPath() + path,
					this.getAlbumPassword()
				));
			});

			// 等待异步处理
			let contents = await Promise.all(promises).then((results) => {
				let contents = [];
				results.forEach((result, index) => {
					result.content.forEach((item) => {
						// 附加路径
						item.path = paths[index];
					});
					contents.push(...result.content);
				});
				return contents;
			});

			// 对列表进行排序
			contents = contents.sort(Helper.compare(true, (item) => {
				return Number(this.parseTrackNumber(item.name))
			}));

			return this.toAudioList(contents);
		}

		/**
		 * 取封面网址
		 * 
		 * @returns {string} 网址
		 */
		async getCoverUrl() {
			let data = await this.alist.getFileInfo(
				this.getAlbumPath() + this.getCoverPath(),
				this.getAlbumPassword()
			);
			return data.raw_url;
		}

		/**
		 * 初始播放器
		 * @param {array} list 列表
		 * @return {APlayer}
		 */
		initPlayer(list) {
			// 创建div并添加到子级
			let div = document.createElement('div');
			this.appendChild(div);

			// 创建播放器
			let aplayer = new window.APlayer({
				// 播放器容器元素
				container: div,
				// 开启吸底模式
				fixed: parseInt(this.options.playerFixed) ? true : false,
				// 列表默认折叠
				listFolded: parseInt(this.options.playerListFolded) ? true : false,
				// 列表最大高度
				listMaxHeight: this.options.playerListMaxHeight || '300px',
				// 音频列表
				audio: list,
			});
			this.aplayer = aplayer;

			// 恢复播放索引
			this.queryPlayerIndex((index) => {
				if (index >= 0 && index <= list.length) {
					// 切换播放索引
					if (index > 0) aplayer.list.switch(index);
					this.restoreStatus = 1;
					this.debug('恢复播放索引', '索引=', index);
				}
			});

			// 播放
			aplayer.on('play', () => {
				// 保存播放索引
				this.savePlayerIndex(aplayer.list.index);
			});

			// 暂停
			aplayer.on('pause', () => {
				// 保存播放时间
				this.savePlayerTime(aplayer.audio.currentTime);
			});

			// 位置改变
			aplayer.on('timeupdate', () => {
				// 记录播放时间
				if (!aplayer.audio.paused) {
					this.savePlayerTime(aplayer.audio.currentTime);
				};
			});

			// 元数据加载
			aplayer.on('loadedmetadata', () => {
				// 恢复播放时间
				if (this.restoreStatus === 1) {
					this.queryPlayerTime((time) => {
						let duration = aplayer.audio.duration;
						if (time && duration && time <= duration) {
							// 跳转播放时间
							aplayer.seek(time);
							this.debug('恢复播放时间', '时间=', time);
						}
					});

					// 无论是否恢复，仅执行一次
					this.restoreStatus = 2;
				}
			});
			return aplayer;
		}

		/**
		 * 取Aliat地址
		 * 
		 * @return {string}
		 */
		getAlistUrl() {
			return this.options.alistUrl || window.location.origin;
		}

		/**
		 * 取专辑路径
		 * 
		 * @return {string}
		 */
		getAlbumPath() {
			let path = this.options.albumPath || decodeURI(window.location.pathname);
			// 去除末尾的反斜杠
			if (path.length > 2) {
				path = Helper.removeEnd(path)
			}
			return path;
		}

		/**
		 * 取专辑密码
		 * 
		 * @return {string}
		 */
		getAlbumPassword() {
			return this.options.albumPassword || '';
		}

		/**
		 * 取专辑名称
		 * 
		 * @return {string}
		 */
		getAlbumName() {
			return this.options.albumName || '缺省';
		}

		/**
		 * 取音轨路径
		 * 
		 * @return {Array<string>}
		 */
		getTrackPaths() {
			let trackPaths = this.options.trackPath.split('|');
			return trackPaths || ['/track'];
		}

		/**
		 * 取音频名称
		 * 
		 * @param {object} content 内容
		 * @returns 
		 */
		getAudioName(content) {
			return [
				this.getAlbumName(),
				this.parseTrackName(content.name) || content.name
			].join(' ')
		}

		/**
		 * 取音频网址
		 * 
		 * @param {object} content 内容
		 * @return {string}
		 */
		getAudioUrl(content) {
			return this.alist.getDownloadUrl(this.getAlbumPath() + content.path, content);
		}

		/**
		 * 取主播名称
		 * @return {string}
		 */
		getArtistName() {
			return this.options.artistName || '缺省';
		}

		/**
		 * 取封面路径
		 * @return {string}
		 */
		getCoverPath() {
			return this.options.coverPath || '/cover.jpg';
		}

		/**
		 * 到音频列表
		 * 
		 * @param {array} contents 内容
		 * @return {array} 列表
		 */
		toAudioList(contents) {
			let result = [];
			contents.forEach((content) => {
				// 忽略目录
				if (!content.is_dir) {
					// 插入音频项
					result.push({
						// 音频名称
						name: this.getAudioName(content),
						// 音频艺术家
						artist: this.getArtistName(),
						// 音频地址
						url: this.getAudioUrl(content),
						// 音频封面
						// cover: this.getDownloadUrl(this.getCoverPath())
					});
				}
			});
			return result;
		}

		/**
		 * 解析音轨编号
		 * 
		 * @param {string} name 名称，音频文件名
		 * @return {string|null}
		 */
		parseTrackNumber(name) {
			// 正则表达式匹配
			let regular = this.options.trackNumber || /(.+)\..+/;
			let patt = new RegExp(regular, 'i');
			let match = patt.exec(name);
			// 优先子匹配文本，否则为匹配文本
			return match ? (match[1] || match[0]) : name
		}

		/**
		 * 解析音轨名称
		 * 
		 * @param {string} name 名称，音频文件名
		 * @return {string}
		 */
		parseTrackName(name) {
			// 正则表达式匹配
			let regular = this.options.trackName || /(.+)\..+/;
			let patt = new RegExp(regular, 'i');
			let match = patt.exec(name);
			// 优先子匹配文本，否则为匹配文本
			return match ? (match[1] || match[0]) : name
		}

		/**
		 * 保存播放索引
		 * 
		 * @param {number} index 索引，从0开始
		 */
		savePlayerIndex(index) {
			index = parseInt(index)
			if (index >= 0) {
				this.saveRecord({index: index});
			}
		}
	
		/**
		 * 查询播放索引
		 * 
		 * @param {function} callback 回调，仅存在时回调
		 * @return {number|null} 成功返回索引，否则返回空
		 */
		queryPlayerIndex(callback) {
			// 取播放索引
			let record = this.queryRecord();
			// 索引从0开始
			let index = record.index === undefined ? null : record.index;
			if (index !== null && typeof callback === 'function') {
				callback(index);
			}
			return index;
		}

		/**
		 * 保存播放时间
		 * 
		 * @param {number} time 时间，单位秒，从0开始
		 */
		savePlayerTime(time) {
			time = parseInt(time)
			if (time >= 0) {
				this.saveRecord({time: time});
			}
		}

		/**
		 * 查询播放时间 
		 * 
		 * @param {function} callback 回调，仅存在时回调
		 * @return {number|null} 成功返回时间，否则返回空
		 */
		queryPlayerTime(callback) {
			// 取播放时间 
			let record = this.queryRecord();
			let time = record.time || null;
			if (time !== null && typeof callback === 'function') {
				callback(time);
			}
			return time;
		}

		/**
		 * 保存记录
		 * 
		 * @param {object} data 数据
		 */
		saveRecord(data) {
			// 取记录列表
			let text = localStorage.getItem(ELEMENT_LABEL + '-records');
			let records = text ? JSON.parse(text) : {};

			// 并入专辑记录
			let key = this.getAlistUrl() + this.getAlbumPath();
			if (key in records) {
				records[key] = Object.assign({}, records[key], data);
			} else {
				records[key] = data;
			}

			// 存储记录列表
			localStorage.setItem(ELEMENT_LABEL + '-records', JSON.stringify(records));
		}

		/**
		 * 查询记录
		 * 
		 * @return {object}
		 */
		queryRecord() {
			// 取存储文本
			let text = localStorage.getItem(ELEMENT_LABEL + '-records');
			if (!text) {
				return {};
			}
	
			// 转为记录列表
			let records = JSON.parse(text);
			if (typeof records !== 'object') {
				return {};
			}
	
			// 取专辑记录
			let key = this.getAlistUrl() + this.getAlbumPath();
			return records[key] || {};
		}

		/**
		 * 调试输出
		 */
		debug() {
			if (parseInt(this.options.debug)) {
				console.log(
					`%c ${ELEMENT_LABEL} %c`,
					'color: #fff; background: #5f5f5f',
					'',
					...arguments
				);
			}
		}
	}

	// 定义自定义元素，注意元素标签名必须含一个破折号（-）
	if (window.customElements && !window.customElements.get(ELEMENT_LABEL)) {
		console.log(
			`%c ${ELEMENT_LABEL} %c v1.0.0 %c https://gitee.com/xhwsd/${ELEMENT_LABEL}`,
			'color: #fff; background: #5f5f5f',
			'color: #fff; background: #70c6be',
			''
		);
		window.YsxsPlayerElement = YsxsPlayerElement;
		window.customElements.define(ELEMENT_LABEL, YsxsPlayerElement);
	}
}

// 派生div标签
Helper.deriveElement(ELEMENT_LABEL, ATTRIBUTE_PREFIX);