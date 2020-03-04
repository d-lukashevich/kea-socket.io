import { getContext, getPluginContext } from 'kea';
import { trimNamespace, getCurrentName } from './utils';
import { SYSTEM_EVENTS } from './config';

export const observe = ({ type, payload, socket }) => {
  /** error handle */
  const { options = {} } = getPluginContext('kea-socket.io');
  const { errorHandler, ERROR_EVENTS = [], mapSocketEventToStore, prefix = '' } = options;
  if (ERROR_EVENTS.includes(type)) {
    errorHandler({ error: payload, getKeaContext: getContext, socket });
  }

  const keaContext = getContext();

  const { mount: { mounted = {} } = {} } = keaContext;

  /** action type logic */
  const namespace = trimNamespace(socket.nsp);
  let storeActionName = type;
  if (SYSTEM_EVENTS.includes(type)) {
    storeActionName = 'sys_' + storeActionName;
  }
  storeActionName = namespace ? namespace + '_' + storeActionName : storeActionName;
  storeActionName = prefix ? prefix + storeActionName : storeActionName;
  storeActionName = mapSocketEventToStore({ name: storeActionName });

  /** find action */
  Object.keys(mounted).forEach((logicKey) => {
    const logic = mounted[logicKey];
    const currentName = logic.socketPrefix ? getCurrentName(storeActionName, logic.socketPrefix) : storeActionName;
    if (Object.keys(logic.actions).includes(currentName)) {
      /** call action */
      const func = logic.actions[currentName];
      if (typeof func === 'function') {
        func({ payload });
      }
    }
  });
};