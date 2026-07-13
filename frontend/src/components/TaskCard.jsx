import { useDraggable } from '@dnd-kit/core';

export default function TaskCard({ task, onClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 999 }
    : undefined;

  const initials = task.assignee?.name
    ? task.assignee.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      {...listeners}
      {...attributes}
      onClick={(e) => { if (!transform) onClick(task); }}
    >
      <div className="task-card-title">
        {task.title.length > 60 ? task.title.slice(0, 60) + '…' : task.title}
      </div>
      <div className="task-card-footer">
        <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
        <div className={`avatar ${task.assignee ? '' : 'empty'}`} title={task.assignee?.name || 'Unassigned'}>
          {initials}
        </div>
      </div>
    </div>
  );
}
