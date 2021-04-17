import * as React from "react";
import {ComponentClass, FunctionComponent, MutableRefObject, useRef, useState} from "react";

export type RComponent<T> = FunctionComponent<T> | ComponentClass<T>;

type LoadPromiseProps<D, P> = {
  /** Provides promise. Either this field or {@link promise} must be specified.*/
  loader?: () => Promise<D>,
  /** Promise. Either this field or {@link loader} must be specified. */
  promise?: Promise<D>,
  /** Display loaded data (if successful)*/
  success: RComponent<{ data: D } & P>,
  /** Displays failure message (if failed) */
  failure?: RComponent<{ failure: any }>,
  /** This component is rendered until data load is done (either successfully or with failure) */
  progress?: RComponent<any>,
  additional: P
};

/**
 * Adapt data renderer to Promise renderer. Optionally, renders loading state and failed load.
 */
export function LoadPromise<D, P>(props: LoadPromiseProps<D, P>) {
  const [loaded, setLoaded]: [D, (d:D) => void] = useState(null);
  const [failure, setFailure] = useState(null);
  const promise: MutableRefObject<Promise<D>> = useRef(null);
  if (promise.current == null) {
    let p;
    if (props.loader) p = props.loader();
    else if (props.promise) p = props.promise;
    else throw new Error("Missing promise");
    promise.current = p;
    p.then(setLoaded, setFailure);
  }
  if (failure != null) {
    const Failure = props.failure || ((p: { failure: any }) => (<div>{p.failure.toString()}</div>));
    return <Failure failure={failure}/>;
  }
  if (loaded == null) {
    const Progress = props.progress;
    return Progress ? <Progress/> : null;
  }
  const Success = props.success;
  const params: { data: D } & P = Object.assign({}, props.additional, {data: loaded});
  return <Success {...params}/>
}


/**
 * Adapts a component that needs a loaded data to a Promise of this data.
 * @param loader a function that returns a Promise, invoked on each instantiation of the result component
 * @param component a component that renders loaded data
 * @param additonalParams additional parameters of the wrapped component
 * @param failure an optional component that renders load failure
 * @param progress an optional component that renders loading progress
 */
export function withLoadedPromiseAndParams<D, P>(loader: () => Promise<D>,
                                                 component: RComponent<{ data: D } & P>,
                                                 additonalParams: P,
                                                 failure?: RComponent<{ failure: any }>,
                                                 progress?: RComponent<any>) {
  const params: LoadPromiseProps<D, P> = {
    loader: loader, success: component, failure: failure, progress: progress,
    additional: additonalParams
  };
  return () => <LoadPromise {...params} />;
}

export class Listeners<L> {
  private next: number = 0;
  private listeners: any = {};

  addListener(l: L): () => void {
    const key = this.next;
    this.next++;
    this.listeners[key] = l;
    return () => {
      delete this.listeners[key];
    }
  }

  forEachListener(f: (l: L) => void): void {
    for (let k in this.listeners) {
      if (this.listeners.hasOwnProperty(k)) f(this.listeners[k]);
    }
  }
}
