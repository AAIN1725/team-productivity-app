import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';

export default function KanbanColumn({ id, title, tasks, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="kanban-col" style={{ border: isOver ? '2px solid var(--primary)' : undefined }}>
      <div className="kanban-col-header">
        <span className="kanban-col-title">{title}</span>
        <span className="kanban-col-count">{tasks.length}</span>
      </div>
      <div className="kanban-col-body">
        {tasks.length === 0
          ? <div className="kanban-empty">No tasks here</div>
          : tasks.map(task => (
              <TaskCard key={task.id} task={task} onClick={() => onCardClick && onCardClick(task)} />
            ))
        }
      </div>
    </div>
  );
}
