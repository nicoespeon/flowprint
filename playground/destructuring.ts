const config = { host: "localhost", port: 3000 };
const { host, port } = config;

function connect({ host, port }: { host: string; port: number }) {
  console.log(host, port);
}
connect(config);

const response = { data: { name: "Alice" } };
const { name: userName } = response.data;
