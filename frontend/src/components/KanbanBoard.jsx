import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export default function KanbanBoard({ tasks, onStatusChange, locked, onCardClick }) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragStart({ active }) {
    setActiveTask(tasks.find(t => t.id === active.id) || null);
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null);
    if (!over) return;
    const newStatus = over.id;
    const task = tasks.find(t => t.id === active.id);
    if (task && task.status !== newStatus) {
      onStatusChange(active.id, newStatus);
    }
  }

  if (locked) {
    return (
      <div style={{ position: 'relative' }}>
        <div className="kanban-board" style={{ opacity: 0.5, pointerEvents: 'none' }}>
          {COLUMNS.map(col => (
            <KanbanColumn key={col.id} id={col.id} title={col.title}
              tasks={tasks.filter(t => t.status === col.id)} onCardClick={() => {}} />
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e1b4b', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
            🔒 Sprint completed — board is locked
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {COLUMNS.map(col => (
          <KanbanColumn key={col.id} id={col.id} title={col.title}
            tasks={tasks.filter(t => t.status === col.id)} onCardClick={onCardClick} />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} onClick={() => {}} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
