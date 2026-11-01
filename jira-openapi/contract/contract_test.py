import json, os, sys, uuid, urllib.request, urllib.error, yaml
from http.cookiejar import CookieJar
from jsonschema import Draft202012Validator, FormatChecker
from openapi_spec_validator import validate

BASE = os.environ.get("API_BASE_URL", "http://localhost:8080")
SPEC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "openapi.yml")
spec = yaml.safe_load(open(SPEC_PATH))
validate(spec)
if "--validate-only" in sys.argv:
    print("openapi.yml is a valid OpenAPI " + spec["openapi"] + " document")
    sys.exit(0)
covered, results = set(), []


def resolve(node):
    if isinstance(node, dict) and "$ref" in node:
        cur = spec
        for part in node["$ref"][2:].split("/"):
            cur = cur[part]
        return resolve(cur)
    return node


def response_schema(template, method, status):
    op = spec["paths"][template][method.lower()]
    resp = op["responses"].get(str(status))
    if resp is None:
        return False, None
    resp = resolve(resp)
    content = resp.get("content", {}).get("application/json")
    return True, (content["schema"] if content else None)


class Client:
    def __init__(self):
        self.jar = CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def call(self, label, method, template, params=None, body=None, query="", raw=None, headers=None):
        path = template
        for k, v in (params or {}).items():
            path = path.replace("{" + k + "}", v)
        prefix = "" if template == "/" else "/api/v1"
        req = urllib.request.Request(BASE + prefix + path + query, method=method)
        data = None
        if body is not None:
            data = json.dumps(body).encode()
            req.add_header("Content-Type", "application/json")
        if raw is not None:
            data = raw[1]
            req.add_header("Content-Type", raw[0])
        try:
            r = self.opener.open(req, data)
            status, text = r.status, r.read()
        except urllib.error.HTTPError as e:
            status, text = e.code, e.read()
        payload = json.loads(text) if text else None
        documented, schema = response_schema(template, method, status)
        problems = []
        if not documented:
            problems.append(f"status {status} tidak terdokumentasi")
        elif schema is not None:
            wrapper = {"$schema": "https://json-schema.org/draft/2020-12/schema", "components": spec["components"], **schema}
            errs = list(Draft202012Validator(wrapper, format_checker=FormatChecker()).iter_errors(payload))
            problems += [f"{list(e.path)}: {e.message[:80]}" for e in errs[:2]]
        elif payload not in (None, ):
            problems.append("respons seharusnya kosong")
        covered.add((method, template))
        results.append((label, status, problems))
        return status, payload


def multipart(field, filename, ctype, content):
    boundary = uuid.uuid4().hex
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field}\"; filename=\"{filename}\"\r\n"
            f"Content-Type: {ctype}\r\n\r\n").encode() + content + f"\r\n--{boundary}--\r\n".encode()
    return (f"multipart/form-data; boundary={boundary}", body)


owner, member, outsider = Client(), Client(), Client()
sfx = uuid.uuid4().hex[:6]
_, o = owner.call("signUp", "POST", "/auth/signup", body={"username": f"olivia{sfx}", "email": f"o{sfx}@mail.com", "password": "Password123!"})
_, m = member.call("signUp member", "POST", "/auth/signup", body={"username": f"mia{sfx}", "email": f"m{sfx}@mail.com", "password": "Password123!"})
outsider.call("signUp outsider", "POST", "/auth/signup", body={"username": f"ozzy{sfx}", "email": f"z{sfx}@mail.com", "password": "Password123!"})
owner.call("signUp duplicate", "POST", "/auth/signup", body={"username": f"olivia{sfx}", "email": f"o{sfx}@mail.com", "password": "Password123!"})
owner.call("signUp invalid", "POST", "/auth/signup", body={"username": "a"})
Client().call("signIn wrong", "POST", "/auth/signin", body={"email": f"o{sfx}@mail.com", "password": "nope-nope"})
Client().call("signIn invalid", "POST", "/auth/signin", body={})
Client().call("signIn ok", "POST", "/auth/signin", body={"email": f"o{sfx}@mail.com", "password": "Password123!"})
owner.call("getHealth", "GET", "/")
owner.call("getCurrentUser", "GET", "/auth/me")
Client().call("getCurrentUser 401", "GET", "/auth/me")
owner.call("searchUsers", "GET", "/users", query=f"?q=mia{sfx}")
owner.call("searchUsers 400", "GET", "/users", query="?q=a")
owner.call("getUser", "GET", "/users/{userId}", {"userId": o["id"]})
owner.call("getUser 404", "GET", "/users/{userId}", {"userId": str(uuid.uuid4())})
owner.call("getUser 400", "GET", "/users/{userId}", {"userId": "nope"})
owner.call("updateUser", "PATCH", "/users/{userId}", {"userId": o["id"]}, body={"username": f"olivia{sfx}x"})
owner.call("updateUser 401", "PATCH", "/users/{userId}", {"userId": m["id"]}, body={"username": "hijack"})
owner.call("updateUser 422", "PATCH", "/users/{userId}", {"userId": o["id"]}, body={"username": f"mia{sfx}"})
owner.call("uploadAvatar", "PUT", "/users/{userId}/avatar", {"userId": o["id"]}, raw=multipart("avatar", "a.png", "image/png", b"\x89PNG" + b"0" * 64))
owner.call("uploadAvatar 400", "PUT", "/users/{userId}/avatar", {"userId": o["id"]}, raw=multipart("avatar", "a.html", "text/html", b"<b>x</b>"))

_, p = owner.call("createProject", "POST", "/projects", body={"key": f"K{sfx}".upper()[:10], "name": "Contract", "url": "https://example.com", "description": "d"})
owner.call("createProject 422", "POST", "/projects", body={"key": p["key"], "name": "Dup"})
owner.call("createProject 400", "POST", "/projects", body={"key": "1", "name": ""})
pid = {"projectId": p["id"]}
owner.call("listProjects", "GET", "/projects")
owner.call("getProject", "GET", "/projects/{projectId}", pid)
outsider.call("getProject 404", "GET", "/projects/{projectId}", pid)
owner.call("updateProject", "PATCH", "/projects/{projectId}", pid, body={"name": "Contract v2", "url": None})
owner.call("addMember", "POST", "/projects/{projectId}/members", pid, body={"userId": m["id"]})
owner.call("addMember 422", "POST", "/projects/{projectId}/members", pid, body={"userId": m["id"]})
owner.call("addMember 404", "POST", "/projects/{projectId}/members", pid, body={"userId": str(uuid.uuid4())})
member.call("addMember 403", "POST", "/projects/{projectId}/members", pid, body={"userId": o["id"]})
member.call("updateProject 403", "PATCH", "/projects/{projectId}", pid, body={"name": "x"})
owner.call("listMembers", "GET", "/projects/{projectId}/members", pid)

_, i = owner.call("createIssue", "POST", "/projects/{projectId}/issues", pid, body={"title": "First", "type": "bug", "priority": "high", "estimate": 5, "assigneeIds": [m["id"]]})
owner.call("createIssue 400", "POST", "/projects/{projectId}/issues", pid, body={"title": ""})
iid = {**pid, "issueId": i["id"]}
owner.call("listIssues", "GET", "/projects/{projectId}/issues", pid, query=f"?search=first&status=backlog&type=bug&assigneeId={m['id']}")
owner.call("listIssues 400", "GET", "/projects/{projectId}/issues", pid, query="?status=blocked")
owner.call("getIssue", "GET", "/projects/{projectId}/issues/{issueId}", iid)
owner.call("getIssue 404", "GET", "/projects/{projectId}/issues/{issueId}", {**pid, "issueId": str(uuid.uuid4())})
member.call("updateIssue", "PATCH", "/projects/{projectId}/issues/{issueId}", iid, body={"status": "inprogress", "listPosition": 2.5, "estimate": None, "assigneeIds": []})
owner.call("updateIssue 400", "PATCH", "/projects/{projectId}/issues/{issueId}", iid, body={})

_, c = member.call("createComment", "POST", "/projects/{projectId}/issues/{issueId}/comments", iid, body={"body": "hello"})
owner.call("createComment 400", "POST", "/projects/{projectId}/issues/{issueId}/comments", iid, body={"body": ""})
cid = {**iid, "commentId": c["id"]}
owner.call("listComments", "GET", "/projects/{projectId}/issues/{issueId}/comments", iid)
member.call("updateComment", "PATCH", "/projects/{projectId}/issues/{issueId}/comments/{commentId}", cid, body={"body": "edited"})
owner.call("updateComment 403", "PATCH", "/projects/{projectId}/issues/{issueId}/comments/{commentId}", cid, body={"body": "x"})
outsider.call("updateComment 404", "PATCH", "/projects/{projectId}/issues/{issueId}/comments/{commentId}", cid, body={"body": "x"})
owner.call("deleteComment", "DELETE", "/projects/{projectId}/issues/{issueId}/comments/{commentId}", cid)
owner.call("deleteIssue", "DELETE", "/projects/{projectId}/issues/{issueId}", iid)

owner.call("removeMember 403 owner", "DELETE", "/projects/{projectId}/members/{userId}", {**pid, "userId": o["id"]})
member.call("removeMember 403", "DELETE", "/projects/{projectId}/members/{userId}", {**pid, "userId": o["id"]})
member.call("removeMember self", "DELETE", "/projects/{projectId}/members/{userId}", {**pid, "userId": m["id"]})
owner.call("deleteProject", "DELETE", "/projects/{projectId}", pid)
owner.call("signOut", "POST", "/auth/signout")
member.call("deleteUser", "DELETE", "/users/{userId}", {"userId": m["id"]})
member.call("deleteUser 401", "DELETE", "/users/{userId}", {"userId": o["id"]})

allops = {(mt.upper(), pt) for pt, v in spec["paths"].items() for mt in v if mt in ("get", "post", "put", "patch", "delete")}
missing = sorted(allops - covered)
bad = [r for r in results if r[2]]
for label, status, problems in results:
    print(("GAGAL " if problems else "OK    ") + f"{label:42} HTTP {status}" + (f"  {problems}" if problems else ""))
print(f"\n{len(results) - len(bad)}/{len(results)} respons sesuai spec | operasi tercakup: {len(covered)}/{len(allops)}")
if missing:
    print("BELUM TERCAKUP:", missing)
sys.exit(1 if bad or missing else 0)
