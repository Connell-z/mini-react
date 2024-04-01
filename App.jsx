import React from './core/React.js';
import './style.css';
// let show = false;
// let count = 10;
// const Count = () => {
//   const Foo = <div>foo</div>;
//   const update = React.update();

//   const myBtuClick = () => {
//     show = !show;
//     count++;
//     update();
//   }

//   return (
//     <div>
//       {show && Foo}
//       <div>顶部</div>
//       {show && Foo}
//       <button onClick={myBtuClick}>count {count}</button>
//       {show && Foo}
//       <div>底部</div>
//       {show && Foo}
//     </div>
//   )
// }

// let a = 10;
// const A = () => {
//   console.log('A');
//   const update = React.update();
//   return <div>
//     <button onClick={() => {
//       a++;
//       update();
//     }}>Aclick {a}</button>
//   </div>
// }

// let b = 10;
// const B = () => {
//   console.log('B');
//   const update = React.update();
//   return <div>
//     <button onClick={() => {
//       b++;
//       update();
//     }}>Bclick {b}</button>
//   </div>
// }

// let app = 10;

// const App = () => {
//   const update = React.update();
//   const myBtuClick = () => {
//     app++;
//     update();
//   }

//   console.log('app');
//   return (
//     <div >
//       {/* app */}
//       <button onClick={myBtuClick}>click {app}</button>
//       <Count />
//       <A />
//       <B />
//     </div>
//   )
// }
// export default App



const App = () => {
  const [iptValue, setIptValue] = React.useState('');
  const [todoList, setTodoList] = React.useState([]);
  const [filter, setFilter] = React.useState('all');
  const [displayList, setDisplayList] = React.useState([]);

  React.useEffect(() => {
    const localList = localStorage.getItem('todo');
    if (localList) {
      setTodoList(JSON.parse(localList));
    }
  }, []);

  React.useEffect(() => {
    if (filter === 'all') {
      setDisplayList(todoList);
    } else if (filter === 'done') {
      const doneList = todoList.filter(item => item.state === 'done');
      setDisplayList(doneList);
    } else {
      const activeList = todoList.filter(item => item.state === 'active');
      setDisplayList(activeList);
    }
  }, [filter, todoList]);

  return <div>
    <h1>TODO</h1>
    <div>
      <input
        type='text'
        value={iptValue}
        onChange={(e) => {
          setIptValue(e.target.value);
        }}
      />
      <button
        onClick={() => {
          setTodoList((todoList) => [...todoList, { id: crypto.randomUUID(), title: iptValue, state: 'active' }]);
          setIptValue('');
        }}
      >add</button>
    </div>
    <div>
      <button
        onClick={() => {
          localStorage.setItem('todo', JSON.stringify(todoList));
        }}
      >save</button>
    </div>
    <div>
      <input type="radio" id="all" name="filter" checked={filter === 'all'} onChange={() => setFilter('all')} />
      <label htmlfor="all">all</label>
      <input type="radio" id="done" name="filter" checked={filter === 'done'} onChange={() => setFilter('done')} />
      <label htmlfor="done">done</label>
      <input type="radio" id="active" name="filter" checked={filter === 'active'} onChange={() => setFilter('active')} />
      <label htmlfor="active">active</label>
    </div>
    <div>
      <ul>
        {
          ...displayList?.map(item =>
          (
            <li
              key={item.id}
              className={item.state}
            >
              {item.title}
              <button
                onClick={() => {
                  setTodoList(() => todoList.filter(ctem => {
                    return item.id !== ctem.id
                  }))
                }}
              >remove</button>
              {
                item.state === 'done'
                  ? <button
                    onClick={() => {
                      const doneList = todoList.map(ctem => {
                        if (item.id === ctem.id) {
                          return { ...ctem, state: 'active' }
                        }
                        return ctem
                      });
                      setTodoList(doneList);
                    }}
                  >cancel</button>
                  : <button
                    onClick={() => {
                      const doneList = todoList.map(ctem => {
                        if (item.id === ctem.id) {
                          return { ...ctem, state: 'done' }
                        }
                        return ctem
                      });
                      setTodoList(doneList);
                    }}
                  >done</button>
              }
            </li>
          ))
        }
      </ul>
    </div>
  </div>
}
export default App