import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable, catchError, throwError } from "rxjs";
const CHAT_API = "http://localhost:8080/api/chat/";
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private sessionId: string | null = null;
  constructor(private http: HttpClient) { }
  createSession(userId?: string): Observable<any> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('userId', userId);
    }

    return this.http.post(`${CHAT_API}session`, {}, { headers: httpOptions.headers, params })
      .pipe(
        catchError(error => {
          console.error('Error creating session:', error);
          if (error.error) {
            console.error('Error details:', error.error);
          }
          return throwError(() => error);
        })
      );
  }
  /**
   * Send a message to the chat service
   * @param message The message to send
   * @returns Observable with the response from the chat service
   */
  sendMessage(message: string, sessionId: string): Observable<any> {
    if (!message || !sessionId) {
      return throwError(() => new Error('Message and sessionId are required'));
    }

    const payload: ChatMessage = {
      message,
      sessionId
    };

    return this.http.post(`${CHAT_API}message`, payload, httpOptions)
      .pipe(
        catchError(error => {
          console.error('Error sending message:', error);
          // Log more detailed error information
          if (error.error) {
            console.error('Error details:', error.error);
          }
          return throwError(() => error);
        })
      );
  }

  /**
   * Get chat history
   * @returns Observable with the chat history
   */
  getChatHistory(sessionId: string): Observable<any> {
    return this.http.get(CHAT_API + 'history/' + sessionId, httpOptions)
      .pipe(
        catchError(error => {
          console.error('Error fetching chat history:', error);
          return throwError(() => new Error('Failed to fetch chat history'));
        })
      );
  }

  checkSessionStatus(sessionId: string): Observable<any> {
    return this.http.get(`${CHAT_API}session/${sessionId}`, httpOptions)
      .pipe(
        catchError(error => {
          console.error('Error checking session:', error);
          return throwError(() => error);
        })
      );
  }

  debug(sessionId: string): void {
    console.log('Current sessionId:', sessionId);
    
    this.checkSessionStatus(sessionId).subscribe({
      next: (response) => console.log('Session status:', response),
      error: (error) => console.error('Session check failed:', error)
    });

    this.getChatHistory(sessionId).subscribe({
      next: (history) => console.log('Chat history:', history),
      error: (error) => console.error('History fetch failed:', error)
    });
  }
}

interface ChatMessage {
  message: string;
  sessionId: string;
}