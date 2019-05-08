package org.nodel.toolkit;

import java.util.Map;

import org.joda.time.DateTime;
import org.nodel.Handler;
import org.nodel.Handler.H0;
import org.nodel.Handler.H1;
import org.nodel.Handler.H2;
import org.nodel.SimpleName;
import org.nodel.core.ActionRequestHandler;
import org.nodel.core.Nodel;
import org.nodel.core.NodelServerAction;
import org.nodel.core.NodelServerEvent;
import org.nodel.host.BaseNode;
import org.nodel.host.Binding;
import org.nodel.host.LogEntry;
import org.nodel.reflection.Serialisation;
import org.nodel.threading.CallbackQueue;

public class ManagedNode extends BaseNode {
    
    /**
     * Permanently closed down?
     */
    private boolean _closed;
    
    /**
     * Matches the threading environment.
     */
    private H0 _threadStateHandler;

    /**
     * Matches the threading environment.
     */    
    private CallbackQueue _callbackQueue;
    
    /**
     * The exception handler.
     */
    private H2<String, Exception> _exceptionHandler = new Handler.H2<String, Exception>() {

        @Override
        public void handle(String context, Exception th) {
            String message = "(" + context + ") " + th.toString();
            _logger.info(message);
            _errReader.inject(message);
        }

    };

    /**
     * Provides context
     */
    private H1<Exception> _emitExceptionHandler = new H1<Exception>() {

        @Override
        public void handle(Exception value) {
            Handler.tryHandle(_exceptionHandler, "Emitter", value);
        }

    };    
    
    public ManagedNode(SimpleName name, CallbackQueue callbackQueue, Handler.H0 threadStateHandler) {
        super(name);
        
        _callbackQueue = callbackQueue;
        _threadStateHandler = threadStateHandler;
    }
    
    public NodelServerAction addAction(String actionName, final Handler.H1<Object> actionFunction, Binding metadata) {
        synchronized (_signal) {
            if (_closed)
                throw new IllegalStateException("Node is closed.");
            
            final NodelServerAction action = new NodelServerAction(_name, new SimpleName(Nodel.reduce(actionName)), metadata);
            action.registerAction(new ActionRequestHandler() {

                @Override
                public void handleActionRequest(Object arg) {
                    _threadStateHandler.handle();
                    
                    addLog(DateTime.now(), LogEntry.Source.local, LogEntry.Type.action, action.getAction(), arg);
                    
                    Handler.handle(actionFunction, arg);
                }

            });

            super.addLocalAction(action);
            
            return action;
        }
    }
    
    /**
     * (overloaded - metadata as a map)
     */
    public NodelServerAction addAction(String actionName, final Handler.H1<Object> actionFunction, Map<String, Object> metadata) {
        return addAction(actionName, actionFunction, (Binding) Serialisation.coerce(Binding.class, metadata));
    }
    
    public void removeAction(NodelServerAction action) {
        if (action == null)
            throw new IllegalArgumentException("No action provided");
        
        synchronized(_signal) {
            action.close();
            
            super.removeLocalAction(action);
        }
    }
    
    public NodelServerEvent addEvent(String eventName, Binding metadata) {
        synchronized (_signal) {
            if (_closed)
                throw new IllegalStateException("Node is closed.");

            final NodelServerEvent event = new NodelServerEvent(_name, new SimpleName(Nodel.reduce(eventName)), metadata);
            event.setThreadingEnvironment(_callbackQueue, _threadStateHandler, _emitExceptionHandler);
            event.attachMonitor(new Handler.H2<DateTime, Object>() {
                
                @Override
                public void handle(DateTime timestamp, Object arg) {
                    addLog(timestamp, LogEntry.Source.local, LogEntry.Type.event, event.getEvent(), arg);
                }
                
            });

            super.addLocalEvent(event);

            return event;
        }
    }
    
    public NodelServerEvent addEvent(String eventName, Map<String, Object> metadata) {
        return addEvent(eventName, (Binding) Serialisation.coerce(Binding.class, metadata));
    }
    
    public void removeEvent(NodelServerEvent event) {
        if (event == null)
            throw new IllegalArgumentException("No event provided");
        
        synchronized (_signal) {
            event.close();

            super.removeLocalEvent(event);
        }
    }
    
    /**
     * Allows an external party to inject an info message related to this node.
     */
    public void injectInfo(String msg) {
        super.logInfo(msg);
    }
    
    /**
     * Allows an external party to inject an error message related to this node.
     */
    public void injectError(String msg) {
        super.logError(msg);
    }
    
    /**
     * Sets the description of this node.
     */
    public void setDesc(String desc) {
        super._desc = desc;
    }

    /**
     * Permanently closes down this node.
     */
    public void close() {
        synchronized(_signal) {
            if (_closed)
                return;
            
            super.close();
            
            _closed = true;
        }
    }

}
