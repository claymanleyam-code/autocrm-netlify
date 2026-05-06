export const mockHeaderRow = [
  'First Name', 'Email', 'Company', 'Status', 'Last Email Sent', 'Error'
];

export const mockRows = [
  ['John',   'john@acme.com',                       'Acme',          '',                  '', ''],
  ['Sara',   'sara@globex.com, sara.b@globex.com',  'Globex',        '',                  '', ''],
  ['Mike',   'mike@initech.com',                    'Initech',       'first email sent',  '2026-04-15', ''],
  ['Priya',  'priya@umbrella.co; pm@umbrella.co',   'Umbrella Co.',  '',                  '', ''],
  ['Alex',   '',                                     'Hooli',         '',                  '', '']
];

export const defaultTemplate =
`Hi {{first_name}},

I wanted to quickly introduce magic mind to the team at {{company}}.

Would you be open to a quick chat next week?

Best,
Clay`;
