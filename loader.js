const core = require('@actions/core');
const github = require('@actions/github');

const { authorization, query, download, conf, listDirectories} = require('./crm-request-module');

conf.m_url = core.getInput('crmUrl');
conf.m_user = core.getInput('user');
conf.m_pass = core.getInput('pass');
conf.m_isNetCore = core.getInput('isNetCore');
const path = core.getInput('path');

try {

  const files = listDirectories(path);

  (async () => {

    const isAuthorized = await authorization();

    if (isAuthorized) {

      //for (const file of files) {

      const outputPath = path.resolve(__dirname + "/resultDir", file);
      const url = "";

      try {
        await download(url, outputPath, files);
        console.log(`Файл ${file} успешно загружен`);
      } catch (err) {
        core.setFailed(`Ошибка скачивания файла ${file}: ${err}`);
      }
      //}
    } else {
      core.setFailed(`Авторизация не удалась :С`);
    }

  })();

} catch (error) {
  core.setFailed(error.message);
}