import 'package:flutter/material.dart';
// ...existing code...
import 'dart:io';
import 'package:path/path.dart' as path;
import 'package:fal_client/fal_client.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? imageUrl = "";
  final TextEditingController _controller = TextEditingController();
  String? falApiKey;
  FalClient? fal;
  bool _loadingApiKey = true;
  bool _generating = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadApiKey();
  }

  Future<void> _loadApiKey() async {
    try {
      String? key = Platform.environment['FAL_KEY'];
      if (key == null || key.isEmpty) {
        final homeDir = Platform.environment['HOME'] ?? '';
        final tildePath = path.join(homeDir, '.fal_ai_api_key');
        final absPath = '/Users/ravinbhakta/.fal_ai_api_key';
        File apiKeyFile = File(tildePath);
        if (await apiKeyFile.exists()) {
          key = await apiKeyFile.readAsString();
        } else {
          apiKeyFile = File(absPath);
          if (await apiKeyFile.exists()) {
            key = await apiKeyFile.readAsString();
          }
        }
      }
      if (key != null && key.trim().isNotEmpty) {
        if (mounted) {
          setState(() {
            falApiKey = key?.trim();
            fal = FalClient.withCredentials(falApiKey!);
            _loadingApiKey = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _loadingApiKey = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'API key not found in FAL_KEY or ~/.fal_ai_api_key',
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingApiKey = false;
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error loading API key: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Text to Image')),
      body: Column(
        children: [
          TextField(
            controller: _controller,
            decoration: InputDecoration(labelText: 'Enter prompt'),
          ),
          if (_errorMessage != null)
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Text(_errorMessage!, style: TextStyle(color: Colors.red)),
            ),
          _loadingApiKey
              ? Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: CircularProgressIndicator(),
                )
              : ElevatedButton(
                  onPressed:
                      (falApiKey == null || falApiKey!.isEmpty || _generating)
                      ? null
                      : () => generateImage(_controller.text),
                  child: _generating
                      ? Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            SizedBox(width: 8),
                            Text('Generating...'),
                          ],
                        )
                      : Text('Generate Image'),
                ),
          if (imageUrl != null && imageUrl!.isNotEmpty)
            Expanded(child: Image.network(imageUrl!)),
        ],
      ),
    );
  }

  Future<void> generateImage(String prompt) async {
    if (prompt.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter a prompt';
      });
      return;
    }
    if (falApiKey == null || falApiKey!.isEmpty || fal == null) {
      setState(() {
        _errorMessage = 'API key not loaded';
      });
      return;
    }

    setState(() {
      _generating = true;
      _errorMessage = null;
    });

    try {
      final output = await fal!.subscribe(
        "fal-ai/recraft/v3/text-to-image",
        input: {"prompt": prompt},
        logs: true,
        webhookUrl: "https://optional.webhook.url/for/results",
        onQueueUpdate: (update) {
          print(update);
        },
      );
      print(output.requestId);
      print(output.data);
      if (mounted &&
          output.data['images'] != null &&
          output.data['images'].isNotEmpty) {
        setState(() {
          imageUrl = output.data['images'][0]['url'];
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error: $e';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _generating = false;
        });
      }
    }
  }
}
