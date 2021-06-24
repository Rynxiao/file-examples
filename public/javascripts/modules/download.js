import $ from 'jquery';
const $downloadBody = $('#downloadBody');

const GET = (url) =>
  new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.withCredentials = true;
    xhr.responseType = 'blob'; // or xhr.responseType = "blob";
    xhr.send();

    xhr.onload = function (e) {
      if (xhr.status !== 200) {
        console.error('Unexpected status code ' + xhr.status + ' for ' + url);
        reject();
      }
      resolve(new Blob([xhr.response]));
    };
  });

const download = (fileName, blob) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};

$downloadBody.on('click', '.download', async (event) => {
  const filename = $(event.target).data('name');
  const blob = await GET(`uploads/${filename}`);
  download(filename, blob);
});
