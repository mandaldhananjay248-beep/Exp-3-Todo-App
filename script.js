const STORAGE_KEY = 'taskflow.tasks';
const THEME_KEY = 'taskflow.theme';

const state = {
  tasks: loadTasks(),
  statusFilter: 'all',
  categoryFilter: 'all',
  priorityFilter: 'all',
  searchTerm: '',
  sortBy: 'newest',
  taskToDeleteId: null,
  taskToEditId: null
};

const elements = {
  taskForm: document.getElementById('taskForm'),
  taskTitle: document.getElementById('taskTitle'),
  taskPriority: document.getElementById('taskPriority'),
  taskCategory: document.getElementById('taskCategory'),
  taskDueDate: document.getElementById('taskDueDate'),
  validationMessage: document.getElementById('validationMessage'),
  taskList: document.getElementById('taskList'),
  emptyState: document.getElementById('emptyState'),
  greeting: document.getElementById('greeting'),
  currentDate: document.getElementById('currentDate'),
  totalSummary: document.getElementById('totalSummary'),
  completedSummary: document.getElementById('completedSummary'),
  pendingSummary: document.getElementById('pendingSummary'),
  totalCounter: document.getElementById('totalCounter'),
  activeCounter: document.getElementById('activeCounter'),
  completedCounter: document.getElementById('completedCounter'),
  completionRate: document.getElementById('completionRate'),
  progressFill: document.getElementById('progressFill'),
  searchInput: document.getElementById('searchInput'),
  statusFilters: document.querySelectorAll('.status-filter'),
  categoryFilters: document.querySelectorAll('.category-filter'),
  priorityFilter: document.getElementById('priorityFilter'),
  sortSelect: document.getElementById('sortSelect'),
  clearCompletedBtn: document.getElementById('clearCompletedBtn'),
  themeToggle: document.getElementById('themeToggle'),
  editModal: document.getElementById('editModal'),
  deleteModal: document.getElementById('deleteModal'),
  editTaskForm: document.getElementById('editTaskForm'),
  editTaskTitle: document.getElementById('editTaskTitle'),
  editTaskPriority: document.getElementById('editTaskPriority'),
  editTaskCategory: document.getElementById('editTaskCategory'),
  editTaskDueDate: document.getElementById('editTaskDueDate'),
  deleteConfirmBtn: document.getElementById('deleteConfirmBtn'),
  cancelEditBtn: document.getElementById('cancelEditBtn'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn')
};

function init() {
  attachEventListeners();
  applyTheme(getSavedTheme());
  updateHeader();
  render();
}

function attachEventListeners() {
  elements.taskForm.addEventListener('submit', function (event) {
    event.preventDefault();
    addTask();
  });

  elements.searchInput.addEventListener('input', function (event) {
    state.searchTerm = event.target.value.trim().toLowerCase();
    renderTasks();
  });

  elements.statusFilters.forEach(function (button) {
    button.addEventListener('click', function () {
      state.statusFilter = button.dataset.filter;
      updateFilterButtons();
      renderTasks();
    });
  });

  elements.categoryFilters.forEach(function (button) {
    button.addEventListener('click', function () {
      state.categoryFilter = button.dataset.category;
      updateCategoryButtons();
      renderTasks();
    });
  });

  elements.priorityFilter.addEventListener('change', function (event) {
    state.priorityFilter = event.target.value;
    renderTasks();
  });

  elements.sortSelect.addEventListener('change', function (event) {
    state.sortBy = event.target.value;
    renderTasks();
  });

  elements.clearCompletedBtn.addEventListener('click', function () {
    clearCompleted();
  });

  elements.themeToggle.addEventListener('click', function () {
    const currentTheme = document.body.dataset.theme === 'light' ? 'light' : 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });

  elements.taskList.addEventListener('click', function (event) {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) {
      return;
    }

    const taskId = actionButton.dataset.id;
    const action = actionButton.dataset.action;

    if (action === 'edit') {
      openEditModal(taskId);
      return;
    }

    if (action === 'delete') {
      openDeleteModal(taskId);
    }
  });

  elements.taskList.addEventListener('change', function (event) {
    const checkbox = event.target.closest('input[type="checkbox"]');
    if (checkbox) {
      toggleTask(checkbox.dataset.id);
    }
  });

  document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
    backdrop.addEventListener('click', function () {
      closeEditModal();
      closeDeleteModal();
    });
  });

  elements.editTaskForm.addEventListener('submit', function (event) {
    event.preventDefault();
    saveEditedTask();
  });

  elements.cancelEditBtn.addEventListener('click', closeEditModal);
  elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  elements.deleteConfirmBtn.addEventListener('click', confirmDeleteTask);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeEditModal();
      closeDeleteModal();
    }
  });
}

function addTask() {
  const title = elements.taskTitle.value.trim();
  const priority = elements.taskPriority.value;
  const category = elements.taskCategory.value;
  const dueDate = elements.taskDueDate.value;

  if (!title || !/[A-Za-z0-9]/.test(title)) {
    showValidation('Please enter a valid task name before adding it.');
    return;
  }

  const newTask = {
    id: createId(),
    title: title,
    priority: priority,
    category: category,
    dueDate: dueDate,
    completed: false,
    createdAt: new Date().toISOString()
  };

  state.tasks.unshift(newTask);
  saveTasks();
  render();
  elements.taskForm.reset();
  elements.taskPriority.value = 'medium';
  elements.taskCategory.value = 'personal';
  hideValidation();
}

function render() {
  updateHeader();
  updateFilterButtons();
  updateCategoryButtons();
  updateStats();
  renderTasks();
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  elements.taskList.innerHTML = '';

  if (filteredTasks.length === 0) {
    elements.emptyState.hidden = false;
    elements.emptyState.innerHTML = `
      <div class="empty-icon">✓</div>
      <h3>${getEmptyStateTitle()}</h3>
      <p>${getEmptyStateMessage()}</p>
    `;
    return;
  }

  elements.emptyState.hidden = true;

  filteredTasks.forEach(function (task) {
    const card = document.createElement('article');
    card.className = `task-card ${task.completed ? 'is-complete' : ''}`;
    card.dataset.id = task.id;

    const status = getDueStatus(task.dueDate);

    const taskMain = document.createElement('div');
    taskMain.className = 'task-main';

    const checkWrap = document.createElement('label');
    checkWrap.className = 'check-wrap';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark ${task.title} as complete`);
    checkbox.dataset.id = task.id;

    const customCheck = document.createElement('span');
    customCheck.className = 'check-box';

    checkWrap.appendChild(checkbox);
    checkWrap.appendChild(customCheck);

    const taskBody = document.createElement('div');
    taskBody.className = 'task-body';

    const titleRow = document.createElement('div');
    titleRow.className = 'task-row';

    const title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = task.title;

    const priorityBadge = document.createElement('span');
    priorityBadge.className = `priority-badge priority-${task.priority.toLowerCase()}`;
    priorityBadge.textContent = task.priority.toUpperCase();

    titleRow.appendChild(title);
    titleRow.appendChild(priorityBadge);

    const metaRow = document.createElement('div');
    metaRow.className = 'task-meta';

    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    categoryBadge.textContent = task.category;

    const dueDateText = document.createElement('span');
    dueDateText.className = 'due-date';
    dueDateText.textContent = task.dueDate ? formatDate(task.dueDate) : 'No due date';

    const dueStatus = document.createElement('span');
    dueStatus.className = `due-status ${status.className}`;
    dueStatus.textContent = task.dueDate ? status.label : 'NO DATE';

    metaRow.append(categoryBadge, dueDateText, dueStatus);

    taskBody.append(titleRow, metaRow);
    taskMain.append(checkWrap, taskBody);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'action-btn edit-btn';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.id = task.id;
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.id = task.id;
    deleteBtn.textContent = 'Delete';

    actions.append(editBtn, deleteBtn);
    card.append(taskMain, actions);
    elements.taskList.appendChild(card);
  });
}

function toggleTask(taskId) {
  const task = state.tasks.find(function (item) {
    return item.id === taskId;
  });

  if (!task) {
    return;
  }

  task.completed = !task.completed;
  saveTasks();
  updateStats();
  renderTasks();
}

function openEditModal(taskId) {
  const task = state.tasks.find(function (item) {
    return item.id === taskId;
  });

  if (!task) {
    return;
  }

  state.taskToEditId = taskId;
  elements.editTaskTitle.value = task.title;
  elements.editTaskPriority.value = task.priority;
  elements.editTaskCategory.value = task.category;
  elements.editTaskDueDate.value = task.dueDate || '';
  elements.editModal.classList.add('is-open');
}

function closeEditModal() {
  state.taskToEditId = null;
  elements.editTaskForm.reset();
  elements.editModal.classList.remove('is-open');
}

function saveEditedTask() {
  if (!state.taskToEditId) {
    return;
  }

  const updatedTitle = elements.editTaskTitle.value.trim();
  if (!updatedTitle || !/[A-Za-z0-9]/.test(updatedTitle)) {
    alert('Please enter a valid task title before saving changes.');
    return;
  }

  const task = state.tasks.find(function (item) {
    return item.id === state.taskToEditId;
  });

  if (!task) {
    closeEditModal();
    return;
  }

  task.title = updatedTitle;
  task.priority = elements.editTaskPriority.value;
  task.category = elements.editTaskCategory.value;
  task.dueDate = elements.editTaskDueDate.value;

  saveTasks();
  closeEditModal();
  render();
}

function openDeleteModal(taskId) {
  state.taskToDeleteId = taskId;
  elements.deleteModal.classList.add('is-open');
}

function closeDeleteModal() {
  state.taskToDeleteId = null;
  elements.deleteModal.classList.remove('is-open');
}

function confirmDeleteTask() {
  if (!state.taskToDeleteId) {
    return;
  }

  state.tasks = state.tasks.filter(function (task) {
    return task.id !== state.taskToDeleteId;
  });

  saveTasks();
  closeDeleteModal();
  render();
}

function clearCompleted() {
  const completedTasks = state.tasks.filter(function (task) {
    return task.completed;
  });

  if (completedTasks.length === 0) {
    showValidation('No completed tasks to clear yet.');
    return;
  }

  const confirmed = window.confirm('Delete all completed tasks?');
  if (!confirmed) {
    return;
  }

  state.tasks = state.tasks.filter(function (task) {
    return !task.completed;
  });

  saveTasks();
  render();
}

function showValidation(message) {
  elements.validationMessage.textContent = message;
  elements.validationMessage.hidden = false;
}

function hideValidation() {
  elements.validationMessage.textContent = '';
  elements.validationMessage.hidden = true;
}

function getFilteredTasks() {
  let tasks = [...state.tasks];

  if (state.statusFilter === 'active') {
    tasks = tasks.filter(function (task) {
      return !task.completed;
    });
  }

  if (state.statusFilter === 'completed') {
    tasks = tasks.filter(function (task) {
      return task.completed;
    });
  }

  if (state.categoryFilter !== 'all') {
    tasks = tasks.filter(function (task) {
      return task.category === state.categoryFilter;
    });
  }

  if (state.priorityFilter !== 'all') {
    tasks = tasks.filter(function (task) {
      return task.priority.toLowerCase() === state.priorityFilter.toLowerCase();
    });
  }

  if (state.searchTerm) {
    tasks = tasks.filter(function (task) {
      return task.title.toLowerCase().includes(state.searchTerm);
    });
  }

  tasks = sortTasks(tasks, state.sortBy);
  return tasks;
}

function sortTasks(tasks, sortType) {
  const sortedTasks = [...tasks];

  switch (sortType) {
    case 'oldest':
      sortedTasks.sort(function (a, b) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      break;
    case 'priority':
      sortedTasks.sort(function (a, b) {
        return getPriorityValue(b.priority) - getPriorityValue(a.priority);
      });
      break;
    case 'dueDate':
      sortedTasks.sort(function (a, b) {
        const aDate = a.dueDate ? new Date(a.dueDate + 'T12:00:00').getTime() : Number.MAX_SAFE_INTEGER;
        const bDate = b.dueDate ? new Date(b.dueDate + 'T12:00:00').getTime() : Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      });
      break;
    case 'newest':
    default:
      sortedTasks.sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      break;
  }

  return sortedTasks;
}

function getPriorityValue(priority) {
  const values = {
    high: 3,
    medium: 2,
    low: 1
  };

  return values[priority.toLowerCase()] || 0;
}

function updateFilterButtons() {
  elements.statusFilters.forEach(function (button) {
    const isActive = button.dataset.filter === state.statusFilter;
    button.classList.toggle('is-active', isActive);
  });
}

function updateCategoryButtons() {
  elements.categoryFilters.forEach(function (button) {
    const isActive = button.dataset.category === state.categoryFilter;
    button.classList.toggle('is-active', isActive);
  });
}

function updateHeader() {
  const now = new Date();
  const hour = now.getHours();

  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17) {
    greeting = 'Good evening';
  }

  elements.greeting.textContent = `${greeting}, Dhananjay`;
  elements.currentDate.textContent = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function updateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(function (task) {
    return task.completed;
  }).length;
  const pending = total - completed;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  elements.totalSummary.textContent = total;
  elements.completedSummary.textContent = completed;
  elements.pendingSummary.textContent = pending;

  elements.totalCounter.textContent = total;
  elements.completedCounter.textContent = completed;
  elements.activeCounter.textContent = pending;
  elements.completionRate.textContent = `${completionRate}%`;
  elements.progressFill.style.width = `${completionRate}%`;

  elements.clearCompletedBtn.disabled = completed === 0;
}

function getDueStatus(dueDate) {
  if (!dueDate) {
    return { label: 'UPCOMING', className: 'status-upcoming' };
  }

  const today = getLocalDate(new Date());
  const due = getLocalDate(new Date(dueDate + 'T12:00:00'));
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (due < today) {
    return { label: 'OVERDUE', className: 'status-overdue' };
  }

  if (due.getTime() === today.getTime()) {
    return { label: 'DUE TODAY', className: 'status-today' };
  }

  if (due.getTime() === tomorrow.getTime()) {
    return { label: 'TOMORROW', className: 'status-tomorrow' };
  }

  return { label: 'UPCOMING', className: 'status-upcoming' };
}

function getLocalDate(date) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

function formatDate(dateString) {
  if (!dateString) {
    return 'No due date';
  }

  return new Date(dateString + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getEmptyStateTitle() {
  if (state.searchTerm) {
    return 'No search results';
  }

  if (state.statusFilter === 'completed') {
    return 'No completed tasks';
  }

  if (state.statusFilter === 'active') {
    return 'All caught up';
  }

  if (state.categoryFilter !== 'all') {
    return 'No tasks in this category';
  }

  return 'You are all caught up!';
}

function getEmptyStateMessage() {
  if (state.searchTerm) {
    return 'Try a different keyword or clear the search.';
  }

  if (state.statusFilter === 'completed') {
    return 'Completed tasks will appear here after you finish one.';
  }

  if (state.statusFilter === 'active') {
    return 'Add a task and start making progress.';
  }

  if (state.categoryFilter !== 'all') {
    return 'Create a task in this category to see it here.';
  }

  return 'Add a task and start making progress.';
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(savedTasks)) {
      return [];
    }

    return savedTasks.filter(function (task) {
      return task && typeof task === 'object';
    });
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function getSavedTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  elements.themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
  localStorage.setItem(THEME_KEY, theme);
}

init();
