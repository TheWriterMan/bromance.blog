import { Node, mergeAttributes } from '@tiptap/core';

export type CalloutType = 'info' | 'warning' | 'success' | 'error';

const CALLOUT_CLASSES: Record<CalloutType, string> = {
  info: 'border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg my-4',
  warning: 'border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg my-4',
  success: 'border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg my-4',
  error: 'border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg my-4',
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { type?: CalloutType }) => ReturnType;
    };
  }
}

export const CalloutExtension = Node.create({
  name: 'callout',

  group: 'block',

  content: 'inline*',

  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info' as CalloutType,
        parseHTML: (element) => element.getAttribute('data-callout-type') || 'info',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout-type]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const calloutType = (node.attrs.type as CalloutType) || 'info';
    const classes = CALLOUT_CLASSES[calloutType] || CALLOUT_CLASSES.info;

    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: classes }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { type: attrs?.type || 'info' },
          });
        },
    };
  },
});
