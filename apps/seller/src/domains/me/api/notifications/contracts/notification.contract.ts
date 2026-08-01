export interface NotificationItem {
  id: string
  user: string
  type: string
  channel: 'in_app' | 'web_push'
  title: string
  body: string
  data: Record<string, unknown> | null
  read_at: string | null
  created_at: string
  updated_at: string
}

export interface ListNotificationsRequest {
  page?: number
  limit?: number
}

export interface ListNotificationsResponse {
  results: NotificationItem[]
  page: number
  limit: number
  total_pages: number
  total_results: number
}

export interface UnreadCountResponse {
  unread_count: number
}

export interface ReadNotificationResponse {
  notification: NotificationItem
}

export interface ReadAllNotificationsResponse {
  updated_count: number
}
