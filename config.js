SystemJS.config({
  baseURL:'https://unpkg.com/',
  defaultExtension:false,
  packages:{
    ".":{
      main:'./src/index.js',
    }
  },
  meta:{
    '*.js':{
      'babelOptions':{
        react:true
      }
    },
    '*.css':{ loader:'css' },
    '*.json':{loader:'json'},
   '*.jpg':{loader:'url'}
    
  },
  map:{
    'plugin-babel':'systemjs-plugin-babel@latest/plugin-babel.js',
    'systemjs-babel-build':'systemjs-plugin-babel@latest/systemjs-babel-browser.js',
    'react':'react@17.0.1/umd/react.development.js',
    'react-dom':'react-dom@17.0.1/umd/react-dom.development.js',
    'react-router-dom':'react-router-dom@6.11.0/dist/umd/react-router-dom.production.min.js',
    'css':'systemjs-plugin-css',
    'highcharts':'highcharts@11.4.6/highcharts.js',
   /* 
   'firebase/app': 'firebase@10.12.2/firebase-app.js',
    'firebase/auth': 'firebase@10.12.2/firebase-auth.js',
    */
    'cropperjs':'cropperjs@1.5.13/dist/cropper.js',
    'cropper.css':'cropperjs@1.5.13/dist/cropper.min.css'
     //'react-qr-reader':'react-qr-scanner@0.0.7/lib/index.js'
  },
  transpiler:'plugin-babel'
});

SystemJS.import('./src/index').then(()=>{
  console.log("Modulos carregados com sucesso");
}).catch((error)=>{
  window.location.reload();
  console.log(error);
  console.error.bind(console);
});