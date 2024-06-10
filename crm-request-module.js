const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { HttpsCookieAgent } = require('http-cookie-agent/http');

let cookies = {};

const conf = {
	m_url: '',
	m_user: '',
	m_pass: '',
	m_isNetCore: false,
	m_isIgnoreSSL: false,
	m_timeout: 300 // in seconds
};

const listDirectories = (dirPath) => {
	const directories = [];

	const items = fs.readdirSync(dirPath);
	for (const item of items) {
	const itemPath = path.join(dirPath, item);
	if (fs.statSync(itemPath).isDirectory()) {
		directories.push(item);
	}
	}

	return directories;
};

const getJsonForAuth = () => JSON.stringify({
	UserName: conf.m_user,
	UserPassword: conf.m_pass,
	TimeZoneOffset: -180
});

const getAuthCookie = async () => {
	const jar = new CookieJar();
	const agent = new HttpsCookieAgent({ 
		rejectUnauthorized: !conf.m_isIgnoreSSL, 
		cookies: { jar } 
	});

	const client = axios.create({
		baseURL: conf.m_url,
		httpsAgent: agent,
		withCredentials: true,
	});

	try {
		const response = await client.post('/ServiceModel/AuthService.svc/Login', getJsonForAuth(), {
			headers: { 'Content-Type': 'application/json' }
		});

		const cookies = {};
		if (response.headers['set-cookie']) {
			response.headers['set-cookie'].forEach(cookieStr => {
				const [key, value] = cookieStr.split(';')[0].split('=');
				cookies[key] = value;
			});
		}

		return cookies;
	} catch (error) {
		console.error('Error fetching cookies:', error);
		return {};
	}
};

const setCookieHeaders = (headers) => {
	headers.Cookie = Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join('; ');
	if (cookies.BPMCSRF) {
	headers.Bpmcsrf = cookies.BPMCSRF;
	}
};

const query = async (queryStr, isNeedCookie = true) => {

	if (conf.m_isNetCore == "false") {
		queryStr = `/0${queryStr}`;
		console.log(`Приложение на Net. Framework`);
	} else {
		console.log(`Приложение на Net. Core`);
	}

	const jar = new CookieJar();

	const agent = new HttpsCookieAgent({ 
		rejectUnauthorized: !conf.m_isIgnoreSSL,
		cookies: { jar } 
	});

	const client = axios.create({
		baseURL: conf.m_url,
		httpsAgent: agent,
		withCredentials: true,
	});

	const headers = {
		'Content-Type': 'application/json',
		'Accept-Encoding': 'gzip, deflate, br'
	};

	if (isNeedCookie) {
		setCookieHeaders(headers);
	}

	try {
		const response = await client.post(queryStr, null, { headers });
		return response.data;
	} catch (error) {
		console.error('Error making query:', error);
		throw error;
	}
};

const authorization = async () => {
	cookies = await getAuthCookie();
	return Object.keys(cookies).length > 0;
};

const download = async (outputLocationPath, files) => {
	var queryStr = '/ServiceModel/PackageInstallerService.svc/GetZipPackages';

	if (conf.m_isNetCore == "false") {
	queryStr = `/0${queryStr}`;
	console.log(`Приложение на Net. Framework`);
	} else {
	console.log(`Приложение на Net. Core`);
	}

	const jar = new CookieJar();


	const agent = new HttpsCookieAgent({ 
	rejectUnauthorized: !conf.m_isIgnoreSSL,
	cookies: { jar } 
	});

	const client = axios.create({
		baseURL: conf.m_url,
		httpsAgent: agent,
		timeout: conf.m_timeout * 1000,
		withCredentials: true,
	});

	const headers = {
	"content-type": "application/json",
	"accept": "application/json, text/plain, */*",
	"accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,kk;q=0.6"
	};

	setCookieHeaders(headers);

	const writer = fs.createWriteStream(outputLocationPath);

	try {

	const response = await client.post(queryStr, files, {
		headers,
		responseType: 'stream'
	});

	response.data.pipe(writer);

	return new Promise((resolve, reject) => {
		writer.on('finish', resolve);
		writer.on('error', reject);
	});
	} catch (error) {
	console.error('Error downloading the file:', error);
	throw error;
	}
};

module.exports = {
	authorization,
	query,
	download,
	conf,
	listDirectories
};