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
  console.log("Попытка выгрузки пакетов:");
  console.log(files);

  (async () => {

    const isAuthorized = await authorization();

    if (isAuthorized) {

      console.log("Успешная авторизация.");

      const outputPath = __dirname + "/result.zip";
      const url = "";

      try {
        await download(url, outputPath, files);
        console.log(`Файл ${outputPath} успешно загружен`);
      } catch (err) {
        core.setFailed(`Ошибка скачивания файла ${outputPath}: ${err}`);
      }
      //}
    } else {
      core.setFailed(`Авторизация не удалась :С`);
    }

  })();

} catch (error) {
  core.setFailed(error.message);
}