// static
// const dom = document.createElement('div');
// dom.id = 'id';
// document.getElementById('root').append(dom);

// const textNode = document.createTextNode('');
// textNode.nodeValue = 'app';
// dom.append(textNode);


// v2
// const app = {
//   type: 'div',
//   props: {
//     id: 'id',
//     children: [
//       {
//         type: 'text_Element',
//         props: {
//           nodeValue: 'app',
//           children: []
//         }
//       }
//     ]
//   }
// };

// const dom = document.createElement(app.type);
// dom.id = app.props.id;
// document.getElementById('root').append(dom);

// const textNode = document.createTextNode('');
// textNode.nodeValue = app.props.children[0].props.nodeValue;
// dom.append(textNode);


import ReactDom from './core/ReactDom.js';
import App from './App.jsx';
import React from './core/React.js';

ReactDom.createRoot(document.getElementById('root')).render(<App />);
