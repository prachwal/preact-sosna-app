import { render} from 'preact';
import App from './App';

const appElementId = 'app';

if (!document.getElementById(appElementId)) {
    var element = document.createElement('div')
    element.id = appElementId;
    document.body.appendChild(element);
    console.log(`Created div with id '${appElementId}'`);
}

render(<App />, document.getElementById(appElementId)!);