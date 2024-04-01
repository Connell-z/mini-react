const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.map(item => {
        const isStringOrNumber = typeof (item) === 'string' || typeof (item) === 'number';
        return isStringOrNumber ? createTextNode(item) : item;
      }
      )
    }
  }
};

const createTextNode = (text) => {
  return {
    type: 'text_Element',
    props: {
      nodeValue: text,
      children: []
    }
  }
}

let nextWork = null;
let root = null;
let currentRoot = null;
let deleteDom = [];
let wipFiber = null;
const render = (el, container) => {
  nextWork = {
    dom: container,
    props: {
      children: [el]
    }
  };
  root = nextWork;
}

const workFlowRenderDom = (IdleDeadline) => {
  let isBreak = false;
  while (!isBreak && nextWork) {
    nextWork = performWorkUnit(nextWork);
    if (root?.sibling?.type === nextWork?.type) {
      nextWork = undefined;
    }
    isBreak = IdleDeadline.timeRemaining() < 1;
  }
  if (!nextWork && root) {
    commitRoot();
  }

  if (nextWork && !root) {
    root = currentRoot;
  }
  requestIdleCallback(workFlowRenderDom);
}

const commitRoot = () => {
  deleteDom.forEach(commitDeletion);
  commitWork(root.child);
  commitEffect();
  currentRoot = root;
  root = null;
  deleteDom = [];
}

const commitDeletion = (fiber) => {
  if (fiber.dom) {
    let fiberParent = fiber.parent;
    while (!fiberParent.dom) {
      fiberParent = fiberParent.parent;
    }
    fiberParent.dom.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child);
  }
}

const commitWork = (fiber) => {
  if (!fiber) return
  let fiberParent = fiber.parent;
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }
  if (fiber.effectTag === 'update') {
    updateProps(fiber.dom, fiber.props, fiber.alternate?.props);
    // fiberParent.dom.removeChild(fiber.dom);
    // fiberParent.dom.append(fiber.dom);
  } else if (fiber.effectTag === 'placement') {
    if (fiber.dom) {
      fiberParent.dom.append(fiber.dom);
    }
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

const createDom = (type) => {
  return type === 'text_Element'
    ? document.createTextNode('')
    : document.createElement(type);
}

const updateProps = (dom, nextProps, preProps) => {
  // old有，new没有--删除
  Object.keys(preProps).forEach(key => {
    if (key !== 'children') {
      if (!(key in nextProps)) {
        dom.removeAttribute(key);
      }
    }
  })
  // new有，old没有--添加
  // new有变化，old有--更新
  Object.keys(nextProps).forEach(key => {
    if (key !== 'children') {
      if (nextProps[key] !== preProps[key]) {
        if (key.startsWith('on')) {
          const eventType = key.slice('2').toLowerCase();
          dom.removeEventListener(eventType, preProps[key]);
          dom.addEventListener(eventType, nextProps[key]);
        } else {
          dom[key] = nextProps[key];
        }
      }
    }
  })
}

// 3 处理链表，设置好指针
const initChildren = (fiber, children) => {
  let oldFiber = fiber.alternate?.child;
  let preChild = null;
  children.forEach((child, index) => {
    let newFiber = null;
    const isEqual = oldFiber && child.type === oldFiber.type;
    if (isEqual) {
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        dom: oldFiber.dom,
        effectTag: 'update',
        alternate: oldFiber
      };
    } else {
      if (child) {
        newFiber = {
          type: child.type,
          props: child.props,
          child: null,
          parent: fiber,
          sibling: null,
          dom: null,
          effectTag: 'placement'
        };
      }
      if (oldFiber) {
        deleteDom.push(oldFiber);
      }
    }

    if (oldFiber) oldFiber = oldFiber.sibling;

    if (index === 0 || !preChild) {
      fiber.child = newFiber;
    } else {
      preChild.sibling = newFiber;
    }

    if (child) {
      preChild = newFiber;
    }
  })
  while (oldFiber) {
    deleteDom.push(oldFiber);
    oldFiber = oldFiber.sibling;
  }
}

const updateFunctionComponent = (fiber) => {
  stateHooks = [];
  stateHooksIndex = 0;
  effectHooks = [];
  wipFiber = fiber;
  const children = [fiber.type(fiber.props)];
  initChildren(fiber, children);
}

const updateHostComponent = (fiber) => {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDom(fiber.type));
    updateProps(dom, fiber.props, {});
  }
  const children = fiber.props.children;
  initChildren(fiber, children);
}

const performWorkUnit = (fiber) => {
  const isFunction = (typeof fiber.type === 'function');
  if (isFunction) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
  // initChildren(fiber, children);
  // 4 返回下一个要执行的任务
  if (fiber.child) {
    return fiber.child
  }
  let cacheFiber = fiber;
  while (cacheFiber) {
    if (cacheFiber.sibling) return cacheFiber.sibling
    cacheFiber = cacheFiber.parent;
  }
}

requestIdleCallback(workFlowRenderDom);

// const update = () => {
//   let currentFiber = wipFiber;

//   return () => {
//     nextWork = {
//       ...currentFiber,
//       alternate: currentFiber
//     };
//     root = nextWork;
//   }
// }

let stateHooks;
let stateHooksIndex;
const useState = (initState) => {
  let currentFiber = wipFiber;
  const oldFiber = currentFiber.alternate?.stateHooks[stateHooksIndex];
  const stateHook = {
    state: oldFiber?.state ? oldFiber.state : initState,
    queue: oldFiber?.queue ? oldFiber.queue : []
  };
  stateHook.queue.forEach(action => {
    stateHook.state = action(stateHook.state);
  });
  stateHook.queue = [];
  stateHooksIndex++;
  stateHooks.push(stateHook);

  currentFiber.stateHooks = stateHooks;

  const setState = (action) => {
    const isRender = typeof action === 'function'
      ? action(stateHook.state)
      : action;
    if (isRender === stateHook.state) return
    stateHook.queue.push(typeof action === 'function' ? action : () => action);
    nextWork = {
      ...currentFiber,
      alternate: currentFiber
    };
    root = nextWork;
  }

  return [stateHook.state, setState]
}

let effectHooks;
const useEffect = (callBack, deps) => {
  const effectHook = {
    callBack,
    deps,
    clearup: undefined
  };

  effectHooks.push(effectHook);
  wipFiber.effectHooks = effectHooks;
}

const commitEffect = () => {
  const run = (fiber) => {
    if (!fiber) return
    if (!fiber.alternate) {
      // init
      fiber?.effectHooks?.forEach(effect => {
        effect.clearup = effect.callBack();
      })
    } else {
      // deps have changed, so need rerender
      fiber.effectHooks?.forEach((newHook, index) => {
        if (newHook.deps.length > 0) {
          const oldEffect = fiber?.alternate?.effectHooks[index];
          // some
          const isNotSame = oldEffect?.deps.some((oldDep, i) => {
            return oldDep !== newHook.deps[i]
          });
          isNotSame && (newHook.deps.length > 0 ? (newHook.clearup = newHook.callBack()) : newHook.callBack());
        }
      });
    }
    run(fiber.child);
    run(fiber.sibling);
  }

  const runClearUp = (fiber) => {
    if (!fiber) return
    fiber?.alternate?.effectHooks?.forEach(newHook => {
      newHook.clearup && newHook.clearup();
    });
    runClearUp(fiber.child);
    runClearUp(fiber.sibling);
  }

  runClearUp(root);
  run(root);
}

const React = {
  render,
  createElement,
  // update,
  useState,
  useEffect
}

export default React
