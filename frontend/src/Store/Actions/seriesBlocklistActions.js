import { createAction } from 'redux-actions';
import { batchActions } from 'redux-batched-actions';
import { createThunk, handleThunks } from 'Store/thunks';
import createAjaxRequest from 'Utilities/createAjaxRequest';
import { set, update } from './baseActions';
import createHandleActions from './Creators/createHandleActions';

//
// Variables

export const section = 'seriesBlocklist';

//
// State

export const defaultState = {
  isFetching: false,
  isPopulated: false,
  error: null,
  items: []
};

//
// Actions Types

export const FETCH_SERIES_BLOCKLIST = 'seriesBlocklist/fetchSeriesBlocklist';
export const CLEAR_SERIES_BLOCKLIST = 'seriesBlocklist/clearSeriesBlocklist';

//
// Action Creators

export const fetchSeriesBlocklist = createThunk(FETCH_SERIES_BLOCKLIST);
export const clearSeriesBlocklist = createAction(CLEAR_SERIES_BLOCKLIST);

//
// Action Handlers

export const actionHandlers = handleThunks({

  [FETCH_SERIES_BLOCKLIST]: function(getState, payload, dispatch) {
    dispatch(set({ section, isFetching: true }));

    const promise = createAjaxRequest({
      url: '/blocklist/series',
      data: payload
    }).request;

    promise.done((data) => {
      dispatch(batchActions([
        update({ section, data }),

        set({
          section,
          isFetching: false,
          isPopulated: true,
          error: null
        })
      ]));
    });

    promise.fail((xhr) => {
      dispatch(set({
        section,
        isFetching: false,
        isPopulated: false,
        error: xhr
      }));
    });
  }
});

//
// Reducers

export const reducers = createHandleActions({

  [CLEAR_SERIES_BLOCKLIST]: (state) => {
    return Object.assign({}, state, defaultState);
  }

}, defaultState, section);

