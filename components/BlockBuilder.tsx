import React from 'react';
import { ContentBlock, HeadingBlock, ParagraphBlock, StructureBlock, ExampleBlock, AlertBlock, StructureBlockItem, ExampleBlockItem } from '../types';
import Button from './Button';
import Input from './Input';
import { PlusCircle, Trash2, ArrowUp, ArrowDown, Type, Pilcrow, Milestone, List, AlertTriangle, GripVertical, CheckCircle, HelpCircle, MessageCircleQuestion, MinusCircle } from 'lucide-react';

type BlockBuilderProps = {
  blocks: ContentBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<ContentBlock[]>>;
};

const BlockControls: React.FC<{ onMoveUp: () => void; onMoveDown: () => void; onDelete: () => void; }> = ({ onMoveUp, onMoveDown, onDelete }) => (
  <div className="absolute top-2 right-2 flex bg-card border border-border rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
    <Button variant="ghost" size="icon" onClick={onMoveUp} className="h-8 w-8 rounded-r-none"><ArrowUp className="w-4 h-4" /></Button>
    <Button variant="ghost" size="icon" onClick={onMoveDown} className="h-8 w-8 rounded-none border-l border-r border-border"><ArrowDown className="w-4 h-4" /></Button>
    <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 rounded-l-none text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
  </div>
);

const BlockBuilder: React.FC<BlockBuilderProps> = ({ blocks, setBlocks }) => {
  const updateBlock = (id: string, newContent: Partial<ContentBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...newContent } as ContentBlock : b));
  };
  
  const addBlock = (type: ContentBlock['type']) => {
    const newStructureItems: StructureBlockItem[] = [{ id: `s-item-${Date.now()}`, type: 'positive', content: '' }];
    const newExampleItems: ExampleBlockItem[] = [{ id: `e-item-${Date.now()}`, type: 'positive', examples: [''] }];

    const newBlock: ContentBlock = {
        id: `block-${Date.now()}`,
        type: type,
        ...(type === 'heading' && { level: 2, text: '' }),
        ...(type === 'paragraph' && { text: '' }),
        ...(type === 'structure' && { items: newStructureItems }),
        ...(type === 'examples' && { items: newExampleItems }),
        ...(type === 'alert' && { style: 'info', text: '' }),
    } as ContentBlock;
    setBlocks(prev => [...prev, newBlock]);
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]]; // Swap
    setBlocks(newBlocks);
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    const controls = <BlockControls onMoveUp={() => moveBlock(index, 'up')} onMoveDown={() => moveBlock(index, 'down')} onDelete={() => deleteBlock(block.id)} />;
    
    switch (block.type) {
      case 'heading':
        return (
          <div className="flex items-center gap-2">
            {controls}
            <select value={block.level} onChange={(e) => updateBlock(block.id, { level: parseInt(e.target.value) as 2|3 })} className="p-2 bg-background border border-input rounded-md">
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
            <Input value={block.text} onChange={(e) => updateBlock(block.id, { text: e.target.value })} placeholder="Heading text..." className="text-2xl font-bold"/>
          </div>
        );
      case 'paragraph':
        return (
            <div>
                {controls}
                <textarea value={block.text} onChange={(e) => updateBlock(block.id, { text: e.target.value })} placeholder="Paragraph text..." className="w-full mt-1 p-2 bg-background border border-input rounded-md"/>
            </div>
        );
      case 'structure':
        return (
            <div>
                {controls}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {block.items.map((item, itemIndex) => (
                    <div key={item.id} className="flex items-center gap-2">
                        <select value={item.type} onChange={(e) => {
                            const newItems = [...block.items];
                            newItems[itemIndex].type = e.target.value as StructureBlockItem['type'];
                            updateBlock(block.id, { items: newItems });
                        }} className="p-2 bg-background border border-input rounded-md">
                            <option value="positive">Positive</option>
                            <option value="negative">Negative</option>
                            <option value="interrogative">Interrogative</option>
                            <option value="negativeInterrogative">Neg. Interrogative</option>
                        </select>
                        <Input value={item.content} onChange={(e) => {
                             const newItems = [...block.items];
                             newItems[itemIndex].content = e.target.value;
                             updateBlock(block.id, { items: newItems });
                        }} placeholder="Subject + verb..." className="font-mono"/>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                             const newItems = block.items.filter(i => i.id !== item.id);
                             updateBlock(block.id, { items: newItems });
                        }}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                    </div>
                ))}
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                     const newItem: StructureBlockItem = { id: `s-item-${Date.now()}`, type: 'positive', content: '' };
                     const newItems = [...block.items, newItem];
                     updateBlock(block.id, { items: newItems });
                }}><PlusCircle className="mr-2 w-4 h-4"/> Add Structure Item</Button>
            </div>
        );
        case 'examples':
            return (
              <div>
                {controls}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {block.items.map((item, itemIndex) => (
                    <div key={item.id}>
                      <select
                        value={item.type}
                        onChange={(e) => {
                          const newItems = [...block.items];
                          newItems[itemIndex].type = e.target.value as ExampleBlockItem['type'];
                          updateBlock(block.id, { items: newItems });
                        }}
                        className="p-2 bg-background border border-input rounded-md mb-2 w-full"
                      >
                        <option value="positive">Positive</option>
                        <option value="negative">Negative</option>
                        <option value="interrogative">Interrogative</option>
                        <option value="negativeInterrogative">Neg. Interrogative</option>
                      </select>
                       <textarea
                        value={item.examples.join('\n')}
                        onChange={(e) => {
                          const newItems = [...block.items];
                          newItems[itemIndex].examples = e.target.value.split('\n');
                          updateBlock(block.id, { items: newItems });
                        }}
                        placeholder="One example per line..."
                        className="w-full mt-1 p-2 bg-background border border-input rounded-md h-24"
                      />
                      <Button variant="ghost" size="sm" className="mt-1 text-destructive" onClick={() => {
                        const newItems = block.items.filter(i => i.id !== item.id);
                        updateBlock(block.id, { items: newItems });
                      }}><Trash2 className="w-4 h-4 mr-1"/> Remove Example Group</Button>
                    </div>
                  ))}
                </div>
                 <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                    const newItem: ExampleBlockItem = { id: `e-item-${Date.now()}`, type: 'positive', examples: [''] };
                    const newItems = [...block.items, newItem];
                    updateBlock(block.id, { items: newItems });
                }}><PlusCircle className="mr-2 w-4 h-4"/> Add Example Group</Button>
              </div>
            );
        case 'alert':
            return (
                <div>
                    {controls}
                    <div className="flex gap-2">
                         <select value={block.style} onChange={(e) => updateBlock(block.id, { style: e.target.value as AlertBlock['style'] })} className="p-2 bg-background border border-input rounded-md">
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="success">Success</option>
                        </select>
                        <Input value={block.text} onChange={(e) => updateBlock(block.id, { text: e.target.value })} placeholder="Alert text..."/>
                    </div>
                </div>
            )
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div key={block.id} className="relative p-4 border border-border rounded-lg group bg-secondary/30">
          <GripVertical className="absolute top-1/2 -left-3 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
          {renderBlock(block, index)}
        </div>
      ))}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-dashed border-border">
          <Button variant="outline" onClick={() => addBlock('heading')}><Type className="w-4 h-4 mr-2"/> Heading</Button>
          <Button variant="outline" onClick={() => addBlock('paragraph')}><Pilcrow className="w-4 h-4 mr-2"/> Paragraph</Button>
          <Button variant="outline" onClick={() => addBlock('structure')}><Milestone className="w-4 h-4 mr-2"/> Structure</Button>
          <Button variant="outline" onClick={() => addBlock('examples')}><List className="w-4 h-4 mr-2"/> Examples</Button>
          <Button variant="outline" onClick={() => addBlock('alert')}><AlertTriangle className="w-4 h-4 mr-2"/> Alert</Button>
      </div>
    </div>
  );
};

export default BlockBuilder;