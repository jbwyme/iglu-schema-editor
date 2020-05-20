import React, {useState} from 'react';
import {Table} from 'react-bootstrap';
import Form from "@rjsf/core";
import './App.css';


const schema: any = {
  "title": "Schema editor",
  "type": "object",
  "properties": {
    "$schema": {
      "type": "string",
    },
    "$id": {
      "type": "string",
    },
    "title": {
      "type": "string",
      "description": "The user-friendly display name for this event"
    },
    "description": {
      "type": "string",
      "description": "A description for this event"
    },
    "self": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "The name of the event",
        },
        "vendor": {
          "type": "string",
        },
        "format": {
          "enum": ["jsonschema"],
        },
        "version": {
          "type": "string",
        },
      },
      "required": ["name", "vendor", "format", "version"],
    },

    "properties": {
      "type": "array",
      "description": "The properties to track on the event",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "The name of the property to track",
          },
          "type": {
            "enum": ["string", "number", "boolean"],
            "description": "The data type of the property",
          },
          "description": {
            "type": "string",
            "description": "A description of the property being tracked",
          },
        },
        "required": ["name", "type"],
        "additionalProperties": {
          "type": "string"
        },
      },
    }
  },
  "required": ["$schema", "self", "properties"],
};

const uiSchema = {
  $id: {
    "ui:widget": "hidden",
  },
  $schema: {
    "ui:widget": "hidden",
  },
  type: {
    "ui:widget": "hidden",
  },
  additionalProperties: {
    "ui:widget": "hidden",
  },
  self: {
    name: {
      "ui:disabled": true,
    },
    vendor: {
      "ui:widget": "hidden",
    },
    format: {
      "ui:widget": "hidden",
    }
  }
}

const log = (type: string) => console.log.bind(console, type);

const igluApi = {
  async list(url: string, readKey?: string): Promise<Array<Schema>> {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    if (readKey) {
      headers.append("apikey", readKey);
    }
    const results = await fetch(url, {headers});
    console.log(results);
    switch (results.status) {
      case 200:
        return results.json();
      default:
        throw new Error(`Unexpected response status: ${results.status}`);
    }
  }
}

type Schema = {
  title?: string,
  description: string,
  self: {
    name: string,
    vendor: string,
    format: string,
    version: string,
  },
  properties: {
    [key: string]: {
      "type": string,
      "description": string,
      "examples": string,
    }
  },
}

function App() {
  const [igluRegistryUrl, setIgluRegistryUrl] = useState("https://api.iterative.ly/iglu/schemas/ly.iterative.457f991c-9fec-4ed6-8c5e-8fde92fac55d");
  const [igluRegistryReadKey, setIgluRegistryReadKey] = useState("bQFPmu6Vg80LaMuSNipdB0WJ5EH6QvVD");

  const [isConnected, setIsConnected] = useState(false);
  const [schemaList, setSchemaList] = useState<Schema[]>([]);
  const [editingSchema, setEditingSchema] = useState<Schema>();

  const getSchemaList = async () => {
    const results = await igluApi.list(igluRegistryUrl, igluRegistryReadKey)
    results.sort((a, b) => {
      return a.self.name < b.self.name ? -1 : a.self.name > b.self.name ? 1 : 0;
    })
    setIsConnected(true);
    setSchemaList(results);
  }

  const editSchema = (schema: Schema) => {
    setEditingSchema(schema);
  }

  let editor;
  if (editingSchema) {
    const formData = {
      ...editingSchema,
      properties: Object.entries(editingSchema.properties).map(([name, meta]) => {
        return {
          name,
          ...meta
        }
      })
    };

    editor = <div className="RightCol">
      <Form schema={schema}
        formData={formData}
        uiSchema={uiSchema}
        onChange={log("changed")}
        onSubmit={log("submitted")}
        onError={log("errors")} />
    </div>
  }
  const schemaRows = schemaList.map(schema => {
    return <tr>
      <td onClick={() => editSchema(schema)}>{schema.self.name}</td>
      <td>{schema.self.version}</td>
      <td>{schema.description}</td>
      <td>{Object.keys(schema.properties).length}</td>
      <td>edit | delete</td>
    </tr>
  });

  const disconnectedView = <div>
    <input type="text" placeholder="Iglu Registry URL" value={igluRegistryUrl} onChange={e => setIgluRegistryUrl(e.target.value)} />
    <input type="password" placeholder="Iglu Registry Read Key" value={igluRegistryReadKey} onChange={e => setIgluRegistryReadKey(e.target.value)} />
    <input type="password" placeholder="Iglu Registry Write Key" />
    <button onClick={getSchemaList}>Connect</button>
  </div>;

  const connectedView = <div><h1>{igluRegistryUrl}</h1></div>;

  return (
    <div className="App">
      <div className="Header">
        {isConnected ? connectedView : disconnectedView}
      </div>
      <div className="Body">
        <div className="LeftCol">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Version</th>
                <th>Description</th>
                <th>Properties</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{schemaRows}</tbody>
          </Table>
        </div>
        {editor}
      </div>

    </div>
  );
}

export default App;
