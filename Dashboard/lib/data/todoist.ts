const TODOIST_API = "https://api.todoist.com/rest/v2";

function getToken(): string {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) throw new Error("TODOIST_API_TOKEN must be set in .env.local");
  return token;
}

function getProjectId(): string {
  return process.env.TODOIST_PROJECT_ID ?? "6QvgMpWPqMV34R6X";
}

async function todoistFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${TODOIST_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Todoist API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface TodoistTask {
  id: string;
  content: string;
  description: string;
  is_completed: boolean;
  priority: number;
  due?: {
    date: string;
    string: string;
    is_recurring: boolean;
  };
  section_id?: string;
  labels: string[];
  created_at: string;
}

export interface TodoistSection {
  id: string;
  name: string;
  order: number;
}

export async function getProjectTasks(): Promise<TodoistTask[]> {
  return todoistFetch<TodoistTask[]>(
    `/tasks?project_id=${getProjectId()}`
  );
}

export async function getProjectSections(): Promise<TodoistSection[]> {
  return todoistFetch<TodoistSection[]>(
    `/sections?project_id=${getProjectId()}`
  );
}

export async function getCompletedTasks(): Promise<{items: {task_id: string; content: string; completed_at: string; section_id?: string}[]}> {
  const token = getToken();
  const response = await fetch(
    `https://api.todoist.com/sync/v9/completed/get_all?project_id=${getProjectId()}&limit=50`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) throw new Error(`Todoist sync API error: ${response.status}`);
  return response.json();
}
