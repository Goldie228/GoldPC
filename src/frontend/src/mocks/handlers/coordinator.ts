/**
 * MSW handlers для Coordinator Dashboard API
 * Mock данные для панели управления координатора
 * Основано на документе 05-parallel-development.md (Section 5.4)
 */

import { http, HttpResponse, delay } from 'msw';

// === Типы ===
type AgentTier = 'TIER-1' | 'TIER-2' | 'TIER-3';
type AgentStatusType = 'Active' | 'Idle' | 'Blocked' | 'Review';
type BlockerImpact = 'Low' | 'Medium' | 'High' | 'Critical';

interface Task {
  id: string;
  name: string;
  status: 'In Progress' | 'Review' | 'Blocked' | 'Done';
  progress: number;
}

interface AgentStatus {
  id: string;
  name: string;
  tier: AgentTier;
  currentModule: string;
  currentTasks: Task[];
  progress: number;
  status: AgentStatusType;
  lastUpdate: string;
  wipCount: number;
  wipLimit: number;
}

interface BlockerInfo {
  id: string;
  reporter: string;
  description: string;
  impact: BlockerImpact;
  affectedTasks: string[];
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
  eta?: string;
}

interface SprintMetrics {
  progress: number;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
}

interface CoordinatorDashboardData {
  agents: AgentStatus[];
  blockers: BlockerInfo[];
  metrics: SprintMetrics;
  lastUpdated: string;
}

// === Mock Data Generator ===

const generateMockData = (): CoordinatorDashboardData => {
  const now = new Date();
  const sprintStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 дней назад
  const sprintEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 дней вперёд

  const agents: AgentStatus[] = [
    {
      id: 'agent-a',
      name: 'Agent A',
      tier: 'TIER-2',
      currentModule: 'Frontend',
      progress: 85,
      status: 'Active',
      lastUpdate: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      wipCount: 2,
      wipLimit: 2,
      currentTasks: [
        { id: 'TASK-101', name: 'Catalog UI компоненты', status: 'In Progress', progress: 75 },
        { id: 'TASK-102', name: 'PCBuilder Interface', status: 'Review', progress: 90 },
      ],
    },
    {
      id: 'agent-b',
      name: 'Agent B',
      tier: 'TIER-2',
      currentModule: 'Catalog',
      progress: 62,
      status: 'Review',
      lastUpdate: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      wipCount: 1,
      wipLimit: 2,
      currentTasks: [
        { id: 'TASK-201', name: 'Catalog API endpoints', status: 'Review', progress: 95 },
      ],
    },
    {
      id: 'agent-c',
      name: 'Agent C',
      tier: 'TIER-2',
      currentModule: 'Orders',
      progress: 35,
      status: 'Blocked',
      lastUpdate: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      wipCount: 1,
      wipLimit: 2,
      currentTasks: [
        { id: 'TASK-301', name: 'Orders Service', status: 'Blocked', progress: 35 },
      ],
    },
    {
      id: 'agent-d',
      name: 'Agent D',
      tier: 'TIER-3',
      currentModule: 'Tests',
      progress: 78,
      status: 'Active',
      lastUpdate: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      wipCount: 2,
      wipLimit: 2,
      currentTasks: [
        { id: 'TASK-401', name: 'Unit Tests Catalog', status: 'In Progress', progress: 80 },
        { id: 'TASK-402', name: 'Integration Tests Auth', status: 'In Progress', progress: 70 },
      ],
    },
  ];

  const blockers: BlockerInfo[] = [
    {
      id: 'BLOCK-001',
      reporter: 'Agent C',
      description: 'Ожидает обновления контракта Orders API. Требуется добавить поле trackingNumber в структуру Order.',
      impact: 'High',
      affectedTasks: ['TASK-301', 'TASK-302', 'TASK-103'],
      assignedTo: 'Agent B',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      eta: 'сегодня 18:00',
    },
    {
      id: 'BLOCK-002',
      reporter: 'Agent A',
      description: 'Необходима документация по Auth API endpoints для интеграции с фронтендом.',
      impact: 'Medium',
      affectedTasks: ['TASK-104'],
      assignedTo: 'Agent B',
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      eta: 'завтра 12:00',
    },
  ];

  const metrics: SprintMetrics = {
    progress: 75,
    startDate: sprintStart.toISOString(),
    endDate: sprintEnd.toISOString(),
    totalTasks: 24,
    completedTasks: 18,
    inProgressTasks: 4,
    blockedTasks: 2,
  };

  return {
    agents,
    blockers,
    metrics,
    lastUpdated: now.toISOString(),
  };
};

// === Handlers ===

export const coordinatorHandlers = [
  // GET /api/internal/coordinator/status - получение данных для Dashboard
  http.get('/api/internal/coordinator/status', async () => {
    await delay(300); // Имитация сетевой задержки
    
    const data = generateMockData();
    return HttpResponse.json(data);
  }),
];