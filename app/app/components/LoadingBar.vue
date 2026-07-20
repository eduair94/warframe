<template>
  <!--
    Starts HIDDEN (see the `display: none` below). It used to render visible in
    the SSR HTML, so the first paint of every page was a 50%-black scrim over
    the server-rendered content until hydration finished and app.vue's onMounted
    hid it. That handed Lighthouse a blank-looking page for the whole hydration
    window — Speed Index and Largest Contentful Paint were measured against the
    moment the overlay disappeared, not the moment the content painted.

    Client-side navigation still shows it: plugins/nav-loading.client.ts sets
    `display: flex` inline on `page:start`, which beats the stylesheet.
  -->
  <div id="spinner-wrapper">
    <div class="lds-ring">
      <div></div>
    </div>
  </div>
</template>

<style>
#spinner-wrapper {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.5);
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1021;
  display: none;
  justify-content: center;
  align-items: center;
}

.lds-ring div {
  box-sizing: border-box;
  display: block;
  width: 51px;
  height: 51px;
  margin: 6px;
  border: 6px solid #fff;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #fff transparent transparent transparent;
}

.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}

.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}

.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}

@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>