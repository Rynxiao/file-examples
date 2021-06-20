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

const downloadFile = (filename) => {
  GET(`assets/${filename}`, (blob) => {
    download(filename, blob);
  });
};
