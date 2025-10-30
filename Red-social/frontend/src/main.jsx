import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import './assets/css/layout/public-layout.css';
import './assets/css/layout/private-layout.css';
import './assets/css/components/content-header.css';
import './assets/css/components/posts.css';
import './assets/css/components/forms.css';
import './assets/css/components/users.css';
import './assets/css/components/profile.css';
import './assets/css/components/create-post.css';

// cargar configuracion react time ago

import TimeAgo from 'javascript-time-ago'
import es from 'javascript-time-ago/locale/es.json'

TimeAgo.addDefaultLocale(es)
TimeAgo.addLocale(es)

// arrancar app de react
ReactDOM.createRoot(document.getElementById('root')).render(  
    <App /> 
)
