import type { RollQueryParams, RollResponse } from '../types'

/**
 * WebSocket message types
 */
export enum WebSocketMessageType {
  ROLL = 'roll',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe'
}

/**
 * Base interface for all WebSocket messages
 */
export interface WebSocketMessage {
  type: WebSocketMessageType
  id?: string // Optional message ID for correlation
}

/**
 * Roll request message via WebSocket
 */
export interface WebSocketRollMessage extends WebSocketMessage {
  type: WebSocketMessageType.ROLL
  params: RollQueryParams
}

/**
 * Subscribe to a dice roll channel
 */
export interface WebSocketSubscribeMessage extends WebSocketMessage {
  type: WebSocketMessageType.SUBSCRIBE
  channel: string
}

/**
 * Unsubscribe from a dice roll channel
 */
export interface WebSocketUnsubscribeMessage extends WebSocketMessage {
  type: WebSocketMessageType.UNSUBSCRIBE
  channel: string
}

/**
 * WebSocket response types
 */
export enum WebSocketResponseType {
  ROLL_RESULT = 'roll_result',
  ERROR = 'error',
  SUBSCRIBED = 'subscribed',
  UNSUBSCRIBED = 'unsubscribed'
}

/**
 * Base interface for all WebSocket responses
 */
export interface WebSocketResponse {
  type: WebSocketResponseType
  id?: string // Correlation ID from the request
}

/**
 * Roll result response via WebSocket
 */
export interface WebSocketRollResponse extends WebSocketResponse {
  type: WebSocketResponseType.ROLL_RESULT
  result: RollResponse
  channel?: string // Optional channel if this was a published roll
}

/**
 * Error response via WebSocket
 */
export interface WebSocketErrorResponse extends WebSocketResponse {
  type: WebSocketResponseType.ERROR
  error: string
}

/**
 * Subscription confirmation response
 */
export interface WebSocketSubscribedResponse extends WebSocketResponse {
  type: WebSocketResponseType.SUBSCRIBED
  channel: string
}

/**
 * Unsubscription confirmation response
 */
export interface WebSocketUnsubscribedResponse extends WebSocketResponse {
  type: WebSocketResponseType.UNSUBSCRIBED
  channel: string
}

/**
 * WebSocket connection data
 */
export interface WebSocketData {
  clientId: string
  subscriptions: Set<string>
}
