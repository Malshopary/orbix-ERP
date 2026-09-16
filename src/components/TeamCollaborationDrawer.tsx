import React, { useState, useRef, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { EmployeeTask, TaskPriority, TaskStatus, ChatMessage } from '../types';
import {
  MessageSquare,
  CheckSquare,
  X,
  Maximize2,
  Minimize2,
  Plus,
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Flame,
  Send,
  User,
  Users,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  History,
  Trash2,
  ArrowRight,
  Sparkles,
  Smile,
  Paperclip,
  Check,
  FileText,
} from 'lucide-react';

interface TeamCollaborationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'tasks' | 'chat';
  openNewTask?: boolean;
}

// Helper to display system movement notifications without the long task title ("الحركات دي بس من غير العنوان")
const formatMovementNotification = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/:\s*["'][^"']*["']/g, (match, offset, str) => {
      const preceding = str.slice(0, offset);
      if (preceding.includes('لسبب')) {
        return match;
      }
      return '';
    })
    .trim();
};

export const TeamCollaborationDrawer: React.FC<TeamCollaborationDrawerProps> = ({
  isOpen,
  onClose,
  defaultTab = 'tasks',
  openNewTask = false,
}) => {
  const {
    currentUser,
    users = [],
    employeeTasks = [],
    createEmployeeTask,
    markTaskCompletedByAssignee,
    approveTaskByRequester,
    reopenTaskByRequester,
    deleteEmployeeTask,
    chatMessages = [],
    sendChatMessage,
    pendingTasksCount,
    awaitingApprovalTasksCount,
    showAlert,
    showConfirm,
  } = useErp();

  const [activeTab, setActiveTab] = useState<'tasks' | 'chat'>(defaultTab);
  const [isMaximized, setIsMaximized] = useState(false);

  // Sync default tab if changed
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      if (openNewTask) {
        setShowCreateTaskForm(true);
      }
    }
  }, [isOpen, defaultTab, openNewTask]);

  // Tasks Filter State
  const [taskFilter, setTaskFilter] = useState<
    'all' | 'assigned_to_me' | 'awaiting_approval' | 'created_by_me' | 'approved'
  >('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<'all' | TaskPriority>('all');

  // Task Creation Form State
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [expandedTaskTimelineId, setExpandedTaskTimelineId] = useState<string | null>(null);

  // Action Dialogs State (for completion note or reopen reason)
  const [actionDialogTask, setActionDialogTask] = useState<{
    task: EmployeeTask;
    type: 'complete' | 'reopen';
  } | null>(null);
  const [actionDialogText, setActionDialogText] = useState('');

  // Chat State
  const [selectedChatChannelId, setSelectedChatChannelId] = useState<string>('general');
  const [chatInputText, setChatInputText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, selectedChatChannelId, activeTab]);

  if (!isOpen) return null;

  const currentUserId = currentUser?.id || '';

  // 1. Assignable employees: Exclude current user so they cannot assign tasks to themselves
  const assignableUsers = users.filter(
    (u) => u.id !== currentUserId && u.isActive !== false
  );

  // 2. Strict Privacy: Only the requester and the assigned employee can see their tasks
  const myAccessibleTasks = employeeTasks.filter(
    (task) => task.createdByUserId === currentUserId || task.assignedToUserIds.includes(currentUserId)
  );

  // Filter tasks
  const filteredTasks = myAccessibleTasks.filter((task) => {
    // 1. Tab / Category Filter
    if (taskFilter === 'assigned_to_me') {
      if (!task.assignedToUserIds.includes(currentUserId)) return false;
      if (task.status === 'approved') return false; // Show active
    } else if (taskFilter === 'awaiting_approval') {
      if (task.createdByUserId !== currentUserId || task.status !== 'completed_by_assignee') return false;
    } else if (taskFilter === 'created_by_me') {
      if (task.createdByUserId !== currentUserId) return false;
    } else if (taskFilter === 'approved') {
      if (task.status !== 'approved') return false;
    }

    // 2. Priority filter
    if (taskPriorityFilter !== 'all' && task.priority !== taskPriorityFilter) {
      return false;
    }

    // 3. Search Query
    if (taskSearchQuery.trim()) {
      const q = taskSearchQuery.toLowerCase().trim();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchCreator = task.createdByUserName.toLowerCase().includes(q);
      const matchAssignees = task.assignedToUserNames.some((n) => n.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchCreator && !matchAssignees) return false;
    }

    return true;
  });

  // Handle Create Task Submit
  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى كتابة عنوان للمهمة أو الطلب.',
        type: 'warning',
      });
      return;
    }

    // Ensure current user is never in the assignees list
    const finalAssigneeIds = selectedAssigneeIds.filter((id) => id !== currentUserId);

    if (finalAssigneeIds.length === 0) {
      showAlert({
        title: 'حدد الموظف المكلف',
        message: 'يرجى اختيار موظف واحد على الأقل من زملائك لتكليفه بهذه المهمة (لا يمكنك تكليف نفسك).',
        type: 'warning',
      });
      return;
    }

    createEmployeeTask({
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      priority: newTaskPriority,
      assignedToUserIds: finalAssigneeIds,
      dueDate: newTaskDueDate || undefined,
    });

    // Reset Form
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskDueDate('');
    setSelectedAssigneeIds([]);
    setShowCreateTaskForm(false);

    showAlert({
      title: 'تم إسناد المهمة بنجاح',
      message: `تم إنشاء وإرسال الطلب إلى (${finalAssigneeIds.length}) موظف بنجاح مع إرسال إشعار فوري.`,
      type: 'success',
    });
  };

  // Handle Complete / Reopen Dialog Submission
  const handleConfirmTaskAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionDialogTask) return;

    if (actionDialogTask.type === 'complete') {
      markTaskCompletedByAssignee(actionDialogTask.task.id, actionDialogText.trim());
      showAlert({
        title: 'تم تأكيد الإنجاز',
        message: 'تم إرسال إشعار للموظف الطالب لمراجعة وتأكيد الإنجاز.',
        type: 'success',
      });
    } else if (actionDialogTask.type === 'reopen') {
      if (!actionDialogText.trim()) {
        showAlert({
          title: 'اذكر سبب إعادة الفتح',
          message: 'يرجى كتابة سبب إعادة فتح المهمة للموظف لتوضيح ما يحتاج لإكماله.',
          type: 'warning',
        });
        return;
      }
      reopenTaskByRequester(actionDialogTask.task.id, actionDialogText.trim());
      showAlert({
        title: 'تمت إعادة فتح المهمة',
        message: 'عادت المهمة بحالة غير مكتملة للموظف المنفذ مع ملاحظاتك.',
        type: 'warning',
      });
    }

    setActionDialogTask(null);
    setActionDialogText('');
  };

  // Handle Send Chat
  const handleSendChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    sendChatMessage(selectedChatChannelId, chatInputText.trim());
    setChatInputText('');
  };

  // Quick convert chat message to task
  const handleConvertMessageToTask = (msg: ChatMessage) => {
    setNewTaskTitle(msg.text.slice(0, 80));
    setNewTaskDescription(`مهمة منشأة من رسالة شات كتبها: ${msg.senderName}\n\nنص الرسالة: "${msg.text}"`);
    setActiveTab('tasks');
    setShowCreateTaskForm(true);
  };

  // Chat Channels and Partners
  const otherUsers = users.filter((u) => u.id !== currentUserId && u.isActive !== false);

  // Active channel messages
  const activeChannelMessages = chatMessages.filter((m) => {
    if (selectedChatChannelId === 'general') {
      return m.channelId === 'general';
    }
    // Direct message channel ID format: `dm_${min}_${max}`
    return m.channelId === selectedChatChannelId;
  });

  const getDirectChannelId = (otherId: string) => {
    const ids = [currentUserId, otherId].sort();
    return `dm_${ids[0]}_${ids[1]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" dir="rtl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        className={`relative z-50 h-full bg-slate-50 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out border-r border-slate-200 ${
          isMaximized ? 'w-full max-w-5xl my-auto h-[96vh] rounded-3xl mx-auto border' : 'w-full sm:w-[540px] lg:w-[620px]'
        }`}
      >
        {/* Top Header */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 shrink-0 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 truncate">
                فريق العمل والمحادثات والمهام
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Orbix Hub
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                دردشة فورية ومصفوفة متابعة وتأكيد المهام والطلبات التشاركية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              title={isMaximized ? 'تصغير النافذة' : 'تكبير ملء الشاشة'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors text-lg cursor-pointer"
              title="إغلاق"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Switcher Header */}
        <div className="bg-white px-5 py-2.5 border-b border-slate-200 shrink-0 flex items-center gap-3">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl w-full max-w-sm text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`relative flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap ${
                activeTab === 'tasks'
                  ? 'bg-white text-indigo-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {/* External Red Badge Notch on the corner of the tab button */}
              {pendingTasksCount + awaitingApprovalTasksCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-extrabold text-[10px] font-mono flex items-center justify-center border-2 border-white shadow-xs z-10 pointer-events-none">
                  {pendingTasksCount + awaitingApprovalTasksCount}
                </span>
              )}
              <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>المهام والطلبات To-Do</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`relative flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-white text-indigo-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>الدردشة الفورية Chat</span>
            </button>
          </div>

          <div className="flex-1" />

          {activeTab === 'tasks' && (
            <button
              type="button"
              onClick={() => setShowCreateTaskForm((prev) => !prev)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{showCreateTaskForm ? 'إلغاء الطلب' : '+ طلب / مهمة جديدة'}</span>
            </button>
          )}
        </div>

        {/* Tab 1: TASKS & TO-DO MATRIX */}
        {activeTab === 'tasks' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 text-xs">
            {/* Collapsible Create Task Card */}
            {showCreateTaskForm && (
              <form
                onSubmit={handleCreateTaskSubmit}
                className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-md space-y-3.5 animate-in fade-in zoom-in-98 duration-200"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    إسناد طلب / مهمة عمل جديدة لفريق العمل:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCreateTaskForm(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    إغلاق ✕
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">عنوان الطلب / المهمة *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: جرد الرفوف رقم 4 بمستودع المواد الغذائية أو مراجعة سداد عميل"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">التفاصيل أو الشرح (اختياري)</label>
                  <textarea
                    rows={2}
                    placeholder="اكتب أي تعليمات أو تفاصيل إضافية يلتزم بها الموظف..."
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Multi-assignees selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      الموظف المكلف (يمكنك تحديد موظف أو أكثر معاً):
                    </label>
                    {assignableUsers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedAssigneeIds.length === assignableUsers.length) {
                            setSelectedAssigneeIds([]);
                          } else {
                            setSelectedAssigneeIds(assignableUsers.map((u) => u.id));
                          }
                        }}
                        className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        {selectedAssigneeIds.length === assignableUsers.length ? 'إلغاء التحديد' : 'تحديد كل الموظفين'}
                      </button>
                    )}
                  </div>

                  {assignableUsers.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-center font-bold">
                      لا يوجد موظفون آخرون مسجلون أو نشطون على النظام حالياً لتكليفهم.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto custom-scrollbar p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                      {assignableUsers.map((u) => {
                        const isSelected = selectedAssigneeIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer select-none transition-all ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAssigneeIds([...selectedAssigneeIds, u.id]);
                                } else {
                                  setSelectedAssigneeIds(selectedAssigneeIds.filter((id) => id !== u.id));
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="truncate text-[11px]">{u.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">درجة الأولوية</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
                    >
                      <option value="low">عادي (Low)</option>
                      <option value="medium">متوسط (Medium)</option>
                      <option value="high">هام (High)</option>
                      <option value="urgent">عاجل جداً 🔥 (Urgent)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">تاريخ ووقت الاستحقاق</label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateTaskForm(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إسناد وتعميم المهمة فورياً</span>
                  </button>
                </div>
              </form>
            )}

            {/* Quick Filters Pill Bar */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setTaskFilter('all')}
                className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                  taskFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                الكل ({myAccessibleTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter('assigned_to_me')}
                className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                  taskFilter === 'assigned_to_me'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                }`}
              >
                <span>مهامي المطلوبة مني</span>
                {pendingTasksCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono flex items-center justify-center font-bold">
                    {pendingTasksCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter('awaiting_approval')}
                className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                  taskFilter === 'awaiting_approval'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>بانتظار اعتمادي</span>
                {awaitingApprovalTasksCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-mono flex items-center justify-center font-bold animate-pulse">
                    {awaitingApprovalTasksCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter('created_by_me')}
                className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                  taskFilter === 'created_by_me'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                طلبات أرسلتها ({myAccessibleTasks.filter((t) => t.createdByUserId === currentUserId).length})
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter('approved')}
                className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                  taskFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                الأرشيف المعتمد ({myAccessibleTasks.filter((t) => t.status === 'approved').length})
              </button>
            </div>

            {/* Search and Priority Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ابحث في المهام، المنفذ، العنوان..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pr-8 pl-3 py-2 text-xs focus:border-indigo-500"
                />
              </div>

              <select
                value={taskPriorityFilter}
                onChange={(e) => setTaskPriorityFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700"
              >
                <option value="all">كل الأولويات</option>
                <option value="urgent">عاجل جداً 🔥</option>
                <option value="high">هام</option>
                <option value="medium">متوسط</option>
                <option value="low">عادي</option>
              </select>
            </div>

            {/* Task Cards Stream */}
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs">لا توجد مهام أو طلبات مطابقة لهذا الفلتر</h4>
                  <p className="text-[11px] text-slate-400">
                    يمكنك إسناد مهام جديدة لزملائك بالنقر على زر "+ طلب / مهمة جديدة" بالأعلى.
                  </p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isAssignee = task.assignedToUserIds.includes(currentUserId);
                  const isRequester = task.createdByUserId === currentUserId;
                  const isTimelineOpen = expandedTaskTimelineId === task.id;

                  // Priority Style
                  const priorityColorMap: Record<TaskPriority, { badge: string; border: string }> = {
                    urgent: { badge: 'bg-rose-50 text-rose-700 border-rose-200', border: 'border-r-4 border-r-rose-500' },
                    high: { badge: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-r-4 border-r-amber-500' },
                    medium: { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', border: 'border-r-4 border-r-indigo-400' },
                    low: { badge: 'bg-slate-100 text-slate-600 border-slate-200', border: 'border-r-4 border-r-slate-400' },
                  };

                  // Status Style
                  const statusMap: Record<TaskStatus, { label: string; badge: string; icon: any }> = {
                    pending: { label: 'قيد الانتظار / جارية', badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
                    completed_by_assignee: {
                      label: 'أُنجزت • بانتظار تأكيد الطالب',
                      badge: 'bg-amber-50 text-amber-900 border-amber-200 font-bold',
                      icon: AlertCircle,
                    },
                    approved: { label: 'معتمدة ومؤرشفة ✓', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold', icon: ShieldCheck },
                    reopened: {
                      label: 'أعيد فتحها لعدم اكتمال التنفيذ',
                      badge: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
                      icon: RotateCcw,
                    },
                  };

                  const currentStatusMeta = statusMap[task.status] || statusMap.pending;
                  const StatusIcon = currentStatusMeta.icon;

                  return (
                    <div
                      key={task.id}
                      className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 transition-all hover:shadow-xs ${
                        priorityColorMap[task.priority].border
                      }`}
                    >
                      {/* Top Header info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                currentStatusMeta.badge
                              }`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              <span>{currentStatusMeta.label}</span>
                            </span>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                priorityColorMap[task.priority].badge
                              }`}
                            >
                              {task.priority === 'urgent' && '🔥 عاجل جداً'}
                              {task.priority === 'high' && 'هام'}
                              {task.priority === 'medium' && 'متوسط'}
                              {task.priority === 'low' && 'عادي'}
                            </span>

                            {task.dueDate && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>استحقاق: {task.dueDate}</span>
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-xs text-slate-900 leading-snug">
                            {task.title}
                          </h3>
                        </div>

                        {/* Creator / Admin Delete */}
                        {(isRequester || currentUser?.role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => {
                              showConfirm(
                                `هل تريد حذف هذه المهمة نهائياً؟\n\n"${task.title}"`,
                                () => deleteEmployeeTask(task.id),
                                'تأكيد الحذف'
                              );
                            }}
                            className="text-slate-300 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="حذف المهمة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Participants Info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-400">الطالب:</span>
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                            {task.createdByUserName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-400">المكلف:</span>
                          <span className="font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {task.assignedToUserNames.join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Completed Note Highlight */}
                      {task.completionNote && (
                        <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-emerald-950 space-y-1 text-[11px]">
                          <span className="font-extrabold text-[10px] text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ملاحظة إنجاز المنفّذ:
                          </span>
                          <p className="font-medium">{task.completionNote}</p>
                        </div>
                      )}

                      {/* Reopen Reason Highlight */}
                      {task.status === 'reopened' && task.rejectionReason && (
                        <div className="bg-rose-50/90 p-2.5 rounded-xl border border-rose-200 text-rose-950 space-y-1 text-[11px]">
                          <span className="font-extrabold text-[10px] text-rose-700 flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                            سبب إعادة الفتح من الطالب (مطلوب تعديلها):
                          </span>
                          <p className="font-semibold">{task.rejectionReason}</p>
                        </div>
                      )}

                      {/* ACTIONS ROW (Mutual Verification) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        {/* 1. Assignee Action: Confirm Execution */}
                        {isAssignee && (task.status === 'pending' || task.status === 'reopened') && (
                          <button
                            type="button"
                            onClick={() => {
                              setActionDialogTask({ task, type: 'complete' });
                              setActionDialogText('');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ أكدت التنفيذ (طلب اعتماد الطالب)</span>
                          </button>
                        )}

                        {/* 2. Requester Actions: Approve or Reopen */}
                        {isRequester && task.status === 'completed_by_assignee' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                showConfirm(
                                  `هل تأكدت من إنجاز المهمة وترغب في اعتمادها وأرشفتها نهائياً؟\n\n"${task.title}"`,
                                  () => approveTaskByRequester(task.id),
                                  'تأكيد واعتماد الإنجاز',
                                  'تأكيد واعتماد'
                                );
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>🛡️ تأكيد الإنجاز واعتمادها</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActionDialogTask({ task, type: 'reopen' });
                                setActionDialogText('');
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>↺ لم تنفذ (إعادة فتح)</span>
                            </button>
                          </div>
                        )}

                        {/* If task is already approved */}
                        {task.status === 'approved' && (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>معتمدة ومحفوظة في الأرشيف</span>
                          </span>
                        )}

                        {/* Timeline toggle button */}
                        <button
                          type="button"
                          onClick={() => setExpandedTaskTimelineId(isTimelineOpen ? null : task.id)}
                          className="text-[10px] text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1 mr-auto transition-colors cursor-pointer"
                        >
                          <History className="w-3 h-3 text-slate-400" />
                          <span>سجل الحركات ({task.history.length})</span>
                          {isTimelineOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Expanded Timeline History */}
                      {isTimelineOpen && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-[10px] animate-in fade-in duration-150">
                          <span className="font-extrabold text-slate-700 block">سجل مسار المهمة والتأكيدات:</span>
                          <div className="space-y-1.5 border-r-2 border-slate-200 pr-2.5">
                            {task.history.map((h) => (
                              <div key={h.id} className="space-y-0.5">
                                <div className="flex items-center gap-1 font-bold text-slate-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                  <span>{h.byUserName}</span>
                                  <span className="text-slate-400 font-mono text-[9px]">
                                    ({new Date(h.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})
                                  </span>
                                </div>
                                <p className="text-slate-600 text-[10px] pr-2.5">{h.notes || h.action}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: TEAM CHAT STREAM */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-100">
            {/* Channel Bar */}
            <div className="bg-white px-3 py-2 border-b border-slate-200 shrink-0 flex items-center gap-2 overflow-x-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedChatChannelId('general')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  selectedChatChannelId === 'general'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>🌐 القناة العامة للفريق</span>
              </button>

              {/* Direct Partner Channels */}
              {otherUsers.map((u) => {
                const dmId = getDirectChannelId(u.id);
                const isSelected = selectedChatChannelId === dmId;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedChatChannelId(dmId)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="relative w-5 h-5 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-300 text-slate-700">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{u.name.charAt(0)}</span>
                      )}
                    </div>
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat Messages Stream */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {activeChannelMessages.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold">لا توجد رسائل في هذه المحادثة بعد</p>
                  <p className="text-[10px] text-slate-400">ابدأ المحادثة وشارك الطلبات والاستفسارات مع زملائك.</p>
                </div>
              ) : (
                activeChannelMessages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;

                  if (msg.isSystemNotification) {
                    const cleanText = formatMovementNotification(msg.text);
                    return (
                      <div key={msg.id} className="flex items-center justify-center my-1.5">
                        <div
                          onClick={() => {
                            if (msg.taskId) {
                              setActiveTab('tasks');
                              setTaskFilter('all');
                            }
                          }}
                          className={`bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-full px-3.5 py-1 text-[10px] font-bold shadow-2xs flex items-center gap-1.5 transition-colors ${
                            msg.taskId ? 'cursor-pointer hover:bg-indigo-100 hover:border-indigo-300' : ''
                          }`}
                          title={msg.taskId ? 'انقر لعرض تفاصيل المهمة' : undefined}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{cleanText}</span>
                        </div>
                      </div>
                    );
                  }

                  const senderUser = users.find((u) => u.id === msg.senderId) || (isMe ? currentUser : null);
                  const senderAvatar = senderUser?.avatarUrl || msg.senderAvatar;
                  const senderDisplayName = isMe ? 'أنت' : (senderUser?.name || msg.senderName);
                  const senderInitial = (senderUser?.name || msg.senderName || 'م').charAt(0);

                  const roleNameMap: Record<string, string> = {
                    admin: 'مدير عام',
                    accountant: 'محاسب مالي',
                    sales_cashier: 'كاشير POS',
                    warehouse_keeper: 'أمين مستودع',
                    hr_manager: 'موارد بشرية',
                    auditor: 'مراجع حسابات',
                  };

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 group ${isMe ? 'justify-start' : 'justify-end'}`}
                    >
                      {/* Avatar on Right side for My messages (RTL start) */}
                      {isMe && (
                        <div className="relative shrink-0 mt-1" title={currentUser?.name || 'أنت'}>
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs border-2 border-white ring-1 ring-indigo-200">
                            {senderAvatar ? (
                              <img src={senderAvatar} alt={senderDisplayName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{senderInitial}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Message Content Bubble */}
                      <div className={`flex flex-col min-w-0 max-w-[80%] ${isMe ? 'items-start' : 'items-end'}`}>
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                          <span className="font-extrabold text-slate-800 text-[11px]">{senderDisplayName}</span>
                          {senderUser?.role && roleNameMap[senderUser.role] && (
                            <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 text-slate-600 text-[9px] font-bold">
                              {roleNameMap[senderUser.role]}
                            </span>
                          )}
                          <span className="font-mono text-slate-400 text-[9px]">
                            {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="relative flex items-center gap-1">
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed whitespace-pre-wrap break-words ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                            }`}
                          >
                            {msg.text}
                          </div>

                          {/* Quick convert to task button */}
                          <button
                            type="button"
                            onClick={() => handleConvertMessageToTask(msg)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-xs text-[10px] cursor-pointer shrink-0"
                            title="تحويل هذه الرسالة إلى مهمة / طلب في To-Do"
                          >
                            <CheckSquare className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Avatar on Left side for Other users' messages (RTL end) */}
                      {!isMe && (
                        <div className="relative shrink-0 mt-1" title={senderUser?.name || msg.senderName}>
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs border-2 border-white ring-1 ring-slate-300">
                            {senderAvatar ? (
                              <img src={senderAvatar} alt={senderDisplayName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{senderInitial}</span>
                            )}
                          </div>
                          {senderUser?.isActive !== false && (
                            <span className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Send Input Form */}
            <form onSubmit={handleSendChatSubmit} className="bg-white p-3 border-t border-slate-200 shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shadow-2xs" title={currentUser?.name || 'أنت'}>
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{(currentUser?.name || 'أ').charAt(0)}</span>
                )}
              </div>
              <input
                type="text"
                placeholder={selectedChatChannelId === 'general' ? "اكتب رسالة في القناة العامة للفريق..." : "اكتب رسالة خاصة للزميل..."}
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0"
                title="إرسال"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Complete / Reopen Action Modal Dialog */}
        {actionDialogTask && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  {actionDialogTask.type === 'complete' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      تأكيد إنجاز المهمة وإرسالها للاعتماد
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 text-rose-600" />
                      إعادة فتح المهمة لعدم اكتمال التنفيذ
                    </>
                  )}
                </h3>
                <button
                  type="button"
                  onClick={() => setActionDialogTask(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs font-bold text-slate-700">
                المهمة: <span className="text-indigo-600">{actionDialogTask.task.title}</span>
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  {actionDialogTask.type === 'complete'
                    ? 'ملاحظات الإنجاز (مثال: تم تسليم البضاعة واستلام الإيصال):'
                    : 'سبب إعادة الفتح (اذكر للموظف ما الذي يحتاج لإكماله بدقة) *:'}
                </label>
                <textarea
                  rows={3}
                  required={actionDialogTask.type === 'reopen'}
                  placeholder={
                    actionDialogTask.type === 'complete'
                      ? 'اكتب تفاصيل ما قمت به...'
                      : 'مثال: لم يتم إرفاق الفاتورة أو الأرصدة غير مطابقة...'
                  }
                  value={actionDialogText}
                  onChange={(e) => setActionDialogText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionDialogTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTaskAction}
                  className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-xs cursor-pointer ${
                    actionDialogTask.type === 'complete'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionDialogTask.type === 'complete' ? 'تأكيد وإرسال للاعتماد' : 'إعادة فتح المهمة فوراً'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

