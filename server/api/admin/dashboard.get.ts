import { requireRole } from '../../utils/authorization'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])

  return {
    success: true,
    message: 'Welcome to Admin Dashboard',

    user: {
      id: user.userId,
      email: user.email,
      role: user.role,
    },

    adminName: 'System Administrator',

    statCards: [
      {
        label: 'Total Personnel',
        value: 0,
        deltaPct: null,
        goodDirection: 'up',
        icon: 'users',
      },
      {
        label: 'Active Personnel',
        value: 0,
        deltaPct: null,
        goodDirection: 'up',
        icon: 'user',
      },
      {
        label: 'High Risk',
        value: 0,
        deltaPct: null,
        goodDirection: 'down',
        icon: 'alert',
      },
      {
        label: 'Elevated Risk',
        value: 0,
        deltaPct: null,
        goodDirection: 'down',
        icon: 'triangle',
      },
      {
        label: 'Units',
        value: 0,
        deltaPct: null,
        goodDirection: 'up',
        icon: 'building',
      },
      {
        label: 'Assessments',
        value: 0,
        deltaPct: null,
        goodDirection: 'up',
        icon: 'doc',
      },
      {
        label: 'Avg. Stress',
        value: 0,
        deltaPct: null,
        goodDirection: 'down',
        icon: 'shield',
      },
    ],

    stressTrend: [],

    avgStressScore: 0,
    avgStressDeltaPct: null,

    riskDistribution: [
      {
        label: 'Low',
        pct: 0,
        count: 0,
        color: '#34d399',
      },
      {
        label: 'Moderate',
        pct: 0,
        count: 0,
        color: '#fbbf24',
      },
      {
        label: 'Elevated',
        pct: 0,
        count: 0,
        color: '#fb923c',
      },
      {
        label: 'High',
        pct: 0,
        count: 0,
        color: '#f87171',
      },
    ],

    totalPersonnelForDonut: 0,

    unitBars: [],

    recentActivity: [],

    highRiskPersonnel: [],

    systemOverview: [
      {
        label: 'Total Users',
        value: 0,
        deltaPct: null,
      },
      {
        label: 'Total Units',
        value: 0,
        deltaPct: null,
      },
      {
        label: 'Assessments',
        value: 0,
        deltaPct: null,
      },
      {
        label: 'High Risk Personnel',
        value: 0,
        deltaPct: null,
      },
    ],

    monthlyStats: [],

    systemHealth: [
      {
        name: 'Database',
        status: 'Online',
      },
      {
        name: 'Authentication',
        status: 'Online',
      },
      {
        name: 'ML Prediction Service',
        status: 'Online',
      },
      {
        name: 'API Server',
        status: 'Online',
      },
    ],
  }
})