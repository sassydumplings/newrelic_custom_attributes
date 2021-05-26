# nr-gap-InsightsCustomAttr

 Get list of custom attributes by application for each browser event type.
 
 A CSV file will be generated for each event type and will contain all custom attributes by application.
 
 The CSV will include the count of custom attributes by application.

### Installation: 
npm install

### Usage:
node gapCustomAttr.js -h

**Options:**

  *--version*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Show version number&nbsp;&nbsp;&nbsp;[boolean]
  
  *-k, --key*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Insight query key&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[required]
  
  *-a, --account*&nbsp;&nbsp;&nbsp;&nbsp;RPM account Id&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  [required]
  
  *-h, --help*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Show help&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  [boolean]
  

**Example:**

  gapCustomAttr.js -k K2AUkrAPR7oXqPVYmvkS0NUzseUabsXXX -a 12345                                     

