import * as moment from 'moment';

import React, { useState } from 'react';
import { gql, useMutation, useQuery, useSubscription } from '@apollo/client';
import { mutations, queries, subscriptions } from '../graphql';

import { Alert } from '@erxes/ui/src/utils';
import { CALL_DIRECTION_INCOMING } from '../lib/enums';
import CallIntegrationForm from '../components/Form';
import IncomingCallContainer from './IncomingCall';
import { ModalTrigger } from '@erxes/ui/src/components';
import SipProvider from '../components/SipProvider';
import TerminateSessionForm from '../components/TerminateCallForm';
import WidgetContainer from './Widget';
import { setLocalStorage } from '../utils';

import { getSubdomain } from '@erxes/ui/src/utils/core';
import withCurrentUser from '@erxes/ui/src/auth/containers/withCurrentUser';

const SipProviderContainer = (props) => {
  const [config, setConfig] = useState(
    JSON.parse(localStorage.getItem('config:call_integrations') || '{}'),
  );
  const callInfo = JSON.parse(localStorage.getItem('callInfo') || '{}');
  const sessionCode = sessionStorage.getItem('sessioncode');

  const isConnectCallRequested = JSON.parse(
    localStorage.getItem('isConnectCallRequested') || '{}',
  );

  const { data, loading, error } = useQuery(gql(queries.callUserIntegrations));
  const {
    data: activeSession,
    loading: activeSessionLoading,
    error: activeSessionError,
    refetch,
  } = useQuery(gql(queries.activeSession), {});

  const [createActiveSession] = useMutation(gql(mutations.addActiveSession));
  const [removeActiveSession] = useMutation(
    gql(mutations.callTerminateSession),
  );
  const [updateHistoryMutation] = useMutation(gql(mutations.callHistoryEdit));

  useSubscription(gql(subscriptions.sessionTerminateRequested), {
    variables: { subdomain: getSubdomain(), userId: props.currentUser._id },
    onSubscriptionData: () => {
      if (
        !callInfo?.isRegistered ||
        isConnectCallRequested ||
        isConnectCallRequested === 'true'
      ) {
        setConfig({
          inboxId: config?.inboxId,
          phone: config?.phone,
          wsServer: config?.wsServer,
          token: config?.token,
          operators: config?.operators,
          isAvailable: true,
        });
        setLocalStorage(true, true);
        localStorage.removeItem('isConnectCallRequested');
      } else {
        setConfig({
          inboxId: config?.inboxId,
          phone: config?.phone,
          wsServer: config?.wsServer,
          token: config?.token,
          operators: config?.operators,
          isAvailable: false,
        });
        setLocalStorage(false, false);
        localStorage.removeItem('isConnectCallRequested');
      }
    },
  });

  const createSession = () => {
    createActiveSession()
      .then(() => {
        refetch();
      })
      .catch((e) => {
        Alert.error(e.message);
      });
  };

  const removeSession = () => {
    removeActiveSession()
      .then(() => {
        refetch();

        if (config) {
          setConfig({
            inboxId: config.inboxId,
            phone: config.phone,
            wsServer: config.wsServer,
            token: config.token,
            operators: config.operators,
            isAvailable: true,
          });
          setLocalStorage(true, true);
        }
      })
      .catch((e) => {
        Alert.error(e.message);
      });
  };

  const updateHistory = (
    sessionId: string,
    callStartTime: Date,
    callEndTime: Date,
    callStatus: string,
  ) => {
    let duration = 0;
    if (callStartTime && callEndTime) {
      const startedMoment = moment(callStartTime);
      const endedMoment = moment(callEndTime);
      duration = endedMoment.diff(startedMoment, 'seconds');
    }

    updateHistoryMutation({
      variables: {
        sessionId,
        callStartTime,
        callEndTime,
        callDuration: duration,
        callStatus,
      },
      refetchQueries: ['callHistories'],
    })
      .then()
      .catch((e) => {
        Alert.error(e.message);
      });
  };

  if (loading || activeSessionLoading) {
    return null;
  }
  if (error) {
    return Alert.error(error.message);
  }
  if (activeSessionError) {
    return Alert.error(activeSessionError.message);
  }

  const { callUserIntegrations } = data;
  if (!callUserIntegrations || callUserIntegrations.length === 0) {
    return null;
  }

  const handleSetConfig = (item) => {
    if (item) {
      setConfig(item);
    }
  };

  const content = (args) => (
    <CallIntegrationForm
      {...args}
      data={callUserIntegrations}
      setConfig={handleSetConfig}
    />
  );

  const terminateContent = (args) => (
    <TerminateSessionForm
      {...args}
      setConfig={handleSetConfig}
      removeActiveSession={removeSession}
    />
  );

  if (!config || !config.inboxId) {
    return (
      <ModalTrigger title="Call Config Modal" content={content} isOpen={true} />
    );
  }

  // if (activeSession && activeSession.callsActiveSession) {
  //   if (
  //     (activeSession.callsActiveSession?.lastLoginDeviceId !== sessionCode ||
  //       isConnectCallRequested ||
  //       isConnectCallRequested === "true") &&
  //     !callInfo?.isUnRegistered
  //   ) {
  //     return (
  //       <ModalTrigger
  //         title="Call Config Modal"
  //         content={terminateContent}
  //         isOpen={true}
  //       />
  //     );
  //   }
  // }
  if (!config.isAvailable) {
    return (
      <WidgetContainer
        {...props}
        callUserIntegrations={callUserIntegrations}
        setConfig={handleSetConfig}
      />
    );
  }

  const filteredIntegration = callUserIntegrations.find(
    (integrationConfig) => integrationConfig.phone === config.phone,
  );
  const defaultIntegration = config || filteredIntegration;

  const { wsServer, operators } = defaultIntegration || {};
  const [host, port] = wsServer?.split(':');

  const operator = operators?.[0];
  const { gsUsername, gsPassword } = operator || {};

  const sipConfig = {
    host,
    pathname: '/ws',
    user: gsUsername,
    password: gsPassword,
    // autoRegister: true,
    port: parseInt(port?.toString() || '8089', 10),
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
      {
        urls: 'turn:relay8.expressturn.com:3478',
        username: 'efVCM7AV4B0436ZEJQ',
        credential: 'PtBTQUgzOtZ1T874',
      },
    ],
  };

  return (
    <SipProvider
      {...sipConfig}
      createSession={createSession}
      callsActiveSession={activeSession?.callsActiveSession}
      updateHistory={updateHistory}
      callUserIntegration={filteredIntegration}
    >
      {(state) => (
        <>
          {state?.callDirection === CALL_DIRECTION_INCOMING && (
            <IncomingCallContainer
              {...props}
              callUserIntegrations={callUserIntegrations}
            />
          )}
          <WidgetContainer
            {...props}
            callUserIntegrations={callUserIntegrations}
            setConfig={handleSetConfig}
          />
        </>
      )}
    </SipProvider>
  );
};

export default withCurrentUser(SipProviderContainer);
