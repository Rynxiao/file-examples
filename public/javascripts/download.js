function GET(url, callback) {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.withCredentials = true;
  xhr.responseType = 'blob'; // or xhr.responseType = "blob";
  xhr.send();

  xhr.onload = function (e) {
    if (xhr.status !== 200) {
      alert('Unexpected status code ' + xhr.status + ' for ' + url);
      return false;
    }
    callback(new Blob([xhr.response])); // or new Blob([xhr.response]);
  };
}

const download = (fileName, blob) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};

const getEleById = (id) => document.getElementById(id);
const downloadFile = (dom, url) => {
  dom.addEventListener('click', (event) => {
    event.preventDefault();

    const filename = url.split('/')[2];
    GET(url, (blob) => {
      download(filename, blob);
    });
  });
};

downloadFile(getEleById('pdfDownload'), '/assets/des.pdf');
downloadFile(getEleById('videoDownload'), '/assets/des.jpeg');
downloadFile(getEleById('imageDownload'), '/assets/des.pdf');
downloadFile(getEleById('videoDownload2'), '/assets/mov_bbb.m4v');
downloadFile(getEleById('videoDownload3'), '/assets/mov_bbb.mov');
