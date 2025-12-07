(() => {
  const onoff = document.getElementById('on_off');
  const ekran = document.getElementById('ekran');
  const contend = document.querySelector('.contend');
  const overlay = document.querySelector('.overlay') || document.querySelector('.map');
  let activeVideo = null;
  let monitorOn = false;

  function removeVideo() {
    if (activeVideo && activeVideo.parentNode) {
      activeVideo.pause();
      activeVideo.src = '';
      activeVideo.remove();
    }
    activeVideo = null;
  }

  function copyPosition(fromEl, toEl) {
    const cs = getComputedStyle(fromEl);
    toEl.style.left = cs.left;
    toEl.style.top = cs.top;
    toEl.style.width = cs.width;
    toEl.style.height = cs.height;
    toEl.style.transform = cs.transform === 'none' ? '' : cs.transform;
  }

  function turnOnMonitor() {
    monitorOn = true;
    ekran.style.display = 'none';
    contend.style.display = 'none';
    removeVideo();

    const video = document.createElement('video');
    video.className = 'monitor-video';
    video.src = '../media/on.mp4';
    video.playsInline = true;
    video.autoplay = true;
    video.controls = false;
    video.muted = false;
    copyPosition(ekran, video);
    overlay.appendChild(video);
    activeVideo = video;

    video.addEventListener('ended', () => {
      removeVideo();
      contend.style.display = 'block';
    });

    video.addEventListener('error', () => {
      removeVideo();
      contend.style.display = 'block';
    });
  }

  function turnOffMonitor() {
    monitorOn = false;
    removeVideo();
    contend.style.display = 'none';
    ekran.style.display = 'block';
  }

  onoff.addEventListener('click', () => {
    if (monitorOn) {
      turnOffMonitor();
    } else {
      turnOnMonitor();
    }
  });

  window.addEventListener('resize', () => {
    if (activeVideo) copyPosition(ekran, activeVideo);
  });
})();











document.getElementById("p1").onclick = function() {
  document.getElementById("pole1").style.display = "block";
}

document.getElementById("p2").onclick = function() {
  document.getElementById("pole2").style.display = "block";
}

document.getElementById("p3").onclick = function() {
  document.getElementById("pole3").style.display = "block";
}

document.getElementById("p4").onclick = function() {
  document.getElementById("pole4").style.display = "block";
}

document.getElementById("p5").onclick = function() {
  document.getElementById("pole5").style.display = "block";
}

document.getElementById("p6").onclick = function() {
  document.getElementById("pole6").style.display = "block";
}

document.getElementById("p7").onclick = function() {
  document.getElementById("pole7").style.display = "block";
}

document.getElementById("p8").onclick = function() {
  document.getElementById("pole8").style.display = "block";
}

document.getElementById("i1").onclick = function() {
  document.getElementById("inf1").style.display = "block";
}

document.getElementById("i2").onclick = function() {
  document.getElementById("inf2").style.display = "block";
}

document.getElementById("i3").onclick = function() {
  document.getElementById("inf3").style.display = "block";
}

document.getElementById("i4").onclick = function() {
  document.getElementById("inf4").style.display = "block";
}

document.getElementById("i5").onclick = function() {
  document.getElementById("inf5").style.display = "block";
}

document.getElementById("i6").onclick = function() {
  document.getElementById("inf6").style.display = "block";
}

document.getElementById("i7").onclick = function() {
  document.getElementById("inf7").style.display = "block";
}

document.getElementById("i8").onclick = function() {
  document.getElementById("inf8").style.display = "block";
}





document.getElementById("baza").ondblclick = function() {
  document.getElementById("pole1").style.display = "none";
  document.getElementById("pole2").style.display = "none";
  document.getElementById("pole3").style.display = "none";
  document.getElementById("pole4").style.display = "none";
  document.getElementById("pole5").style.display = "none";
  document.getElementById("pole6").style.display = "none";
  document.getElementById("pole7").style.display = "none";
  document.getElementById("pole8").style.display = "none";
}




document.getElementById("baza3").ondblclick = function() {
  document.getElementById("inf1").style.display = "none";
  document.getElementById("inf2").style.display = "none";
  document.getElementById("inf3").style.display = "none";
  document.getElementById("inf4").style.display = "none";
  document.getElementById("inf5").style.display = "none";
  document.getElementById("inf6").style.display = "none";
  document.getElementById("inf7").style.display = "none";
  document.getElementById("inf8").style.display = "none";
}
